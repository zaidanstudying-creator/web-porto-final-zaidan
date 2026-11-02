import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { getSupabasePublicConfig } from './src/lib/supabase/config';

export async function proxy(request) {
  const config = getSupabasePublicConfig();
  const pathname = request.nextUrl.pathname;
  const isProtectedAdminRoute = pathname.startsWith('/admin') && pathname !== '/admin/login';

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        if (headers) {
          Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        }
      },
    },
  });

  const claimsResult = await supabase.auth.getClaims();
  const claims = claimsResult?.data?.claims ?? null;

  if (isProtectedAdminRoute && !claims) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    redirectResponse.headers.set('Cache-Control', 'private, no-store');
    return redirectResponse;
  }

  if (pathname.startsWith('/admin')) {
    response.headers.set('Cache-Control', 'private, no-store');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
