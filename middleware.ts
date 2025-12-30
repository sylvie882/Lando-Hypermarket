// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define ALL public paths that don't require authentication
  const isPublicPath = 
    // ========== AUTHENTICATION PAGES ==========
    path === '/auth/login' ||
    path === '/auth/register' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password' ||
    path === '/admin/login' ||
    
    // ========== MAIN LANDING & MARKETING PAGES ==========
    path === '/' ||                          // Homepage
    path === '/home' ||                      // Alternative home
    path === '/index' ||                     // Index page
    path === '/deals' ||                     // Deals page
    
    // ========== PRODUCT PAGES ==========
    path === '/products' ||                  // All products
    path.startsWith('/products/') ||         // Individual products (e.g., /products/123)
    path === '/products/search' ||           // Search page
    path === '/products/featured' ||         // Featured products
    path === '/products/new' ||              // New arrivals
    path === '/products/bestsellers' ||      // Bestsellers
    path === '/products/on-sale' ||          // Products on sale
    
    // ========== CATEGORY PAGES ==========
    path === '/categories' ||                // All categories
    path.startsWith('/categories/') ||       // Category pages (e.g., /categories/fruits)
    
    // ========== CUSTOMER SUPPORT ==========
    path === '/contact' ||                   // Contact us
    path === '/support' ||                   // Support center
    path === '/help' ||                      // Help center
    path === '/faq' ||                       // Frequently asked questions
    
    // ========== LEGAL & COMPLIANCE ==========
    path === '/terms' ||                     // Terms of service
    path === '/privacy' ||                   // Privacy policy
    
    // ========== CART (PUBLIC) ==========
    path === '/cart' ||                      // Shopping cart (public viewing)
    
    // ========== API ROUTES & STATIC ASSETS ==========
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/static/') ||
    path.startsWith('/images/') ||
    /\.[a-zA-Z0-9]+$/.test(path) ||          // Any file with extension
    path === '/favicon.ico' ||
    path === '/robots.txt' ||
    path === '/manifest.json';
  
  // Skip middleware for public paths
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
  
  // ========== PROTECT ADMIN ROUTES ==========
  if (path.startsWith('/admin')) {
    // Redirect to admin login if no token
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is admin
    if (user?.role !== 'admin') {
      // If not admin but has token, redirect to homepage
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Admin is authenticated, allow access
    return NextResponse.next();
  }
  
  // ========== PROTECT USER ACCOUNT ROUTES ==========
  if (path.startsWith('/account') || 
      path.startsWith('/profile') ||
      path.startsWith('/settings') ||
      path.startsWith('/my-')) {
    
    // Redirect to login if no token
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // User is authenticated, allow access
    return NextResponse.next();
  }
  
  // ========== PROTECT WISHLIST ROUTES ==========
  if (path.startsWith('/wishlist') || path.startsWith('/profile/wishlist')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      loginUrl.searchParams.set('message', 'Please login to view wishlist');
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }
  
  // ========== PREVENT AUTHENTICATED USERS FROM ACCESSING LOGIN PAGES ==========
  if (token && (
    path === '/admin/login' || 
    path === '/auth/login' || 
    path === '/auth/register' ||
    path === '/auth/forgot-password' ||
    path === '/auth/reset-password'
  )) {
    // Redirect admin to admin dashboard
    if (user?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    // Redirect regular user to profile
    else {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }
  
  // ========== DEFAULT: PROTECT ALL OTHER NON-PUBLIC ROUTES ==========
  if (!token && !isPublicPath) {
    // Store the original requested URL to redirect back after login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', path);
    loginUrl.searchParams.set('message', 'Please login to access this page');
    
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow access for authenticated users or public paths
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