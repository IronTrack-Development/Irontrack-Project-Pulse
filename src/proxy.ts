import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const jsonError = (message: string, status: number) =>
    NextResponse.json({ error: message }, { status });

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/login/sub', '/signup', '/signup/sub', '/terms', '/privacy', '/release-notes', '/status'];
  // Protected routes that require auth + active GC subscription:
  // /schedule-generator — Schedule Simulator (enterprise feature, GC login required)
  const isDevPreviewRoute =
    process.env.NODE_ENV !== 'production' && request.nextUrl.pathname === '/sub/preview';
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname) || isDevPreviewRoute;
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isSubOpsApi = request.nextUrl.pathname.startsWith('/api/sub-ops/');
  const isProjectsApi = request.nextUrl.pathname.startsWith('/api/projects/');
  const isSubView = request.nextUrl.pathname.startsWith('/view/');
  const isJoinRoute = request.nextUrl.pathname.startsWith('/join/');
  const isSubRoute = request.nextUrl.pathname.startsWith('/sub/');
  const isStaticAsset =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/icon') ||
    request.nextUrl.pathname.startsWith('/manifest');

  // Lock down sub-ops APIs before the generic API allow-list.
  // These routes use service-role access deeper in the stack, so ownership
  // must be enforced centrally here to prevent cross-company data exposure.
  if (isSubOpsApi) {
    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    const companyRouteMatch = request.nextUrl.pathname.match(
      /^\/api\/sub-ops\/companies\/([^/]+)(?:\/.*)?$/
    );

    // The root endpoint lists/creates companies scoped to the signed-in user.
    // Company-specific routes below still require ownership verification.
    if (!companyRouteMatch) {
      const normalizedPath = request.nextUrl.pathname.replace(/\/$/, '');
      if (normalizedPath === '/api/sub-ops/companies') {
        return supabaseResponse;
      }
      return jsonError('Forbidden', 403);
    }

    const companyId = companyRouteMatch[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonError('Server auth configuration missing', 500);
    }

    const companyLookupUrl = new URL(`${supabaseUrl}/rest/v1/sub_companies`);
    companyLookupUrl.searchParams.set('select', 'id');
    companyLookupUrl.searchParams.set('id', `eq.${companyId}`);
    companyLookupUrl.searchParams.set('user_id', `eq.${user.id}`);
    companyLookupUrl.searchParams.set('limit', '1');

    try {
      const companyRes = await fetch(companyLookupUrl, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!companyRes.ok) {
        return jsonError('Unable to verify company access', 500);
      }

      const rows = (await companyRes.json()) as Array<{ id: string }>;
      if (!Array.isArray(rows) || rows.length === 0) {
        return jsonError('Forbidden', 403);
      }
    } catch {
      return jsonError('Unable to verify company access', 500);
    }

    return supabaseResponse;
  }

  // Project APIs use service-role access in many handlers. Enforce ownership
  // at the edge for every project-scoped route before generic API passthrough.
  if (isProjectsApi) {
    if (!user) {
      return jsonError('Unauthorized', 401);
    }

    const projectRouteMatch = request.nextUrl.pathname.match(
      /^\/api\/projects\/([^/]+)(?:\/.*)?$/
    );

    if (!projectRouteMatch) {
      return jsonError('Forbidden', 403);
    }

    const projectId = projectRouteMatch[1];
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonError('Server auth configuration missing', 500);
    }

    const projectLookupUrl = new URL(`${supabaseUrl}/rest/v1/daily_projects`);
    projectLookupUrl.searchParams.set('select', 'id');
    projectLookupUrl.searchParams.set('id', `eq.${projectId}`);
    projectLookupUrl.searchParams.set('user_id', `eq.${user.id}`);
    projectLookupUrl.searchParams.set('limit', '1');

    try {
      const projectRes = await fetch(projectLookupUrl, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (!projectRes.ok) {
        return jsonError('Unable to verify project access', 500);
      }

      const rows = (await projectRes.json()) as Array<{ id: string }>;
      if (!Array.isArray(rows) || rows.length === 0) {
        return jsonError('Forbidden', 403);
      }
    } catch {
      return jsonError('Unable to verify project access', 500);
    }

    return supabaseResponse;
  }

  // Allow public routes, non-sub-ops API routes, sub view pages, and static assets
  if (isPublicRoute || isApiRoute || isStaticAsset || isSubView || isJoinRoute) {
    return supabaseResponse;
  }

  // Redirect to login if not authenticated
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = isSubRoute ? '/login/sub' : '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Sub routes: require auth but NOT a GC subscription check
  // (user is already verified above; subs have separate billing)
  if (isSubRoute) {
    return supabaseResponse;
  }

  // Allow subscribe page and setup page for authenticated users
  const isSubscribePage = request.nextUrl.pathname === '/subscribe';
  const isSetupPage = request.nextUrl.pathname === '/setup';

  if (isSubscribePage || isSetupPage) {
    return supabaseResponse;
  }

  // Check subscription status for protected routes
  // Use a try/catch so a DB hiccup doesn't lock users out
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .single();

    // Only redirect to subscribe if we got a definitive "not active" answer
    if (subscription && subscription.status !== 'active') {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/subscribe';
      return NextResponse.redirect(redirectUrl);
    }
    // If no subscription row exists, allow through (new user flow / free beta)
  } catch {
    // DB error — let the user through rather than locking them out
    // The dashboard/API will handle auth properly
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg|ico|woff|woff2|ttf|eot)$).*)',
  ],
};
