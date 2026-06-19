import { relipayMiddleware } from '@relipay/nextjs/middleware';

import { NextResponse } from 'next/server';

// Protect all routes, making '/', '/login', and '/register' publicly accessible.
// Unauthenticated attempts to access other routes (like /dashboard) will redirect to /login.
/*
export default relipayMiddleware({
  publicRoutes: ['/', '/login', '/register'],
  signInUrl: '/login',
});
*/

// Bypassed middleware: allow all routes
export default function middleware() {
  return NextResponse.next();
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - any image/assets files with extensions
  matcher: ['/((?!_next|.*\\..*).*)'],
};
