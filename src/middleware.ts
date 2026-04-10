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
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
  const isAuthApiRoute = request.nextUrl.pathname.startsWith('/api/auth');
  const isStripeApiRoute = request.nextUrl.pathname.startsWith('/api/stripe');
  const isStaticAsset =
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/icon') ||
    request.nextUrl.pathname.startsWith('/manifest');

  // Allow public routes and API routes
  if (isPublicRoute || isAuthApiRoute || isStripeApiRoute || isStaticAsset) {
    return supabaseResponse;
  }

  // Redirect to login if not authenticated
  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check subscription status for protected routes
  if (user && !isPublicRoute && !isAuthApiRoute && !isStripeApiRoute) {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, trial_ends_at')
      .eq('user_id', user.id)
      .single();

    // Allow if no subscription record (will be created on first login)
    // Or if status is active or trialing
    // Or if trial hasn't ended yet
    const now = new Date();
    const trialEndsAt = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
    const isTrialValid = trialEndsAt && trialEndsAt > now;

    if (subscription && subscription.status !== 'active' && subscription.status !== 'trialing' && !isTrialValid) {
      // Redirect to upgrade/payment page
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/subscribe';
      return NextResponse.redirect(redirectUrl);
    }
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
