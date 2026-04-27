import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
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
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isSubView = request.nextUrl.pathname.startsWith('/view/');
  const isJoinRoute = request.nextUrl.pathname.startsWith('/join/');
  const isSubRoute = request.nextUrl.pathname.startsWith('/sub/');
  const isStaticAsset =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/icon') ||
    request.nextUrl.pathname.startsWith('/manifest');

  // Allow public routes, API routes, sub view pages, and static assets
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
