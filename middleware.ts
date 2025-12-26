// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    path === '/admin/login' ||
    path === '/' ||
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/static/') ||
    // Handle file extensions (images, CSS, JS, etc.)
    /\.[a-zA-Z0-9]+$/.test(path);
  
  // Skip middleware for public paths, API routes, and static files
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Get token from cookies
  const token = request.cookies.get('token')?.value || '';
  const userCookie = request.cookies.get('user')?.value || '';
  
  // Parse user data from cookie
  let user = null;
  try {
    if (userCookie) {
      user = JSON.parse(decodeURIComponent(userCookie));
    }
  } catch (error) {
    console.error('Error parsing user cookie:', error);
  }
  
  // Protect admin routes
  if (path.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Check if user is admin
    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Protect authenticated routes (non-public, non-admin)
  if (!token && !isPublicPath) {
    // Store the original requested URL to redirect back after login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    
    return NextResponse.redirect(loginUrl);
  }
  
  // If user has token and tries to access login pages
  if (token && (path === '/admin/login' || path === '/auth/login' || path === '/auth/register')) {
    // Redirect admin to admin dashboard, regular users to home
    if (user?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};