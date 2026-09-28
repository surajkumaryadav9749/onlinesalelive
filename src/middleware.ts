import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'onlinesalelive_admin_token';
const AUTH_SECRET =
  process.env.AUTH_SECRET || 'onlinesalelive_super_secure_jwt_secret_key_32chars_min';
const secretKey = new TextEncoder().encode(AUTH_SECRET);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only handle admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      if (payload.id && payload.role === 'admin') {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  // If user visits /admin/login while already logged in, redirect to /admin
  if (pathname === '/admin/login') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // If user visits any other /admin route while unauthenticated, redirect to /admin/login
  if (!isAuthenticated) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
