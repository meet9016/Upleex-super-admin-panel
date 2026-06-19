import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Define admin routes that need protection
  const adminRoutes = [
    '/dashboard',
    '/vendors',
    '/user-list',
    '/categories',
    '/services',
    '/products',
    '/plans',
    '/orders',
    '/quotes',
    '/settings',
    '/blog',
    '/banners',
    '/faq',
    '/dropdowns',
    '/dynamic-component',
    '/vendor-payments',
    '/vendor-plans-reports',
    '/priority',
    '/admin-permissions'
  ];
  
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route)) || pathname === '/';

  // If token exists and trying to access login → redirect to dashboard
  if (token && pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirect') || '/dashboard';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // If no token and trying to access admin route → redirect to login
  if (!token && isAdminRoute) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/', '/dashboard/:path*', '/vendors/:path*', '/user-list/:path*', '/categories/:path*', '/services/:path*', '/products/:path*', '/plans/:path*', '/orders/:path*', '/quotes/:path*', '/settings/:path*', '/blog/:path*', '/banners/:path*', '/faq/:path*', '/dropdowns/:path*', '/dynamic-component/:path*', '/vendor-payments/:path*', '/vendor-plans-reports/:path*', '/priority/:path*', '/admin-permissions/:path*'],
};

