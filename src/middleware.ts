import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE_NAME = 'chit_session';
const JWT_SECRET_STRING = process.env.AUTH_SECRET || 'chit-fund-super-secret-key-32-chars-long-at-least';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, next internals, api routes if needed
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      await jwtVerify(token, JWT_SECRET);
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  }

  // If user accesses /login, redirect directly to /admin
  if (pathname === '/login') {
    const url = new URL('/admin', request.url);
    return NextResponse.redirect(url);
  }

  // /settings requires admin authentication
  if (pathname.startsWith('/settings') && !isAuthenticated) {
    const url = new URL('/admin', request.url);
    return NextResponse.redirect(url);
  }

  // All other pages (/, /members, /collection, /payments, /auction, /reports, /admin)
  // are accessible to both public viewers and authenticated admins.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
