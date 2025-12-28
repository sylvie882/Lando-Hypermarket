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
    
    // ========== LANDO RANCH SPECIFIC PAGES ==========
    path === '/farm' ||                      // Farm information
    path === '/our-story' ||                 // Our story
    path === '/about' ||                     // About us
    path === '/mission' ||                   // Our mission
    path === '/values' ||                    // Our values
    path === '/sustainability' ||            // Sustainability practices
    path === '/organic-certification' ||     // Organic certification info
    path === '/farm-tour' ||                 // Virtual farm tour
    
    // ========== PRODUCT INFORMATION PAGES ==========
    path === '/fresh-produce' ||             // Fresh produce showcase
    path === '/seasonal-offers' ||           // Seasonal offers
    path === '/whats-in-season' ||           // What's in season
    path === '/product-guides' ||            // Product guides
    path === '/how-to-choose' ||             // How to choose fresh produce
    path === '/storage-tips' ||              // Storage tips
    
    // ========== RECIPES & COOKING ==========
    path === '/recipes' ||                   // Recipe collection
    path.startsWith('/recipes/') ||          // Individual recipes
    path === '/cooking-tips' ||              // Cooking tips
    path === '/meal-plans' ||                // Meal plans
    path === '/healthy-eating' ||            // Healthy eating guide
    
    // ========== ORDERING & DELIVERY ==========
    path === '/how-to-order' ||              // How to order
    path === '/delivery-info' ||             // Delivery information
    path === '/shipping-policy' ||           // Shipping policy
    path === '/delivery-areas' ||            // Delivery areas
    path === '/pickup-locations' ||          // Pickup locations
    path === '/same-day-delivery' ||         // Same day delivery info
    path === '/subscriptions' ||             // Subscription plans
    
    // ========== QUALITY & STANDARDS ==========
    path === '/quality-standards' ||         // Quality standards
    path === '/organic-practices' ||         // Organic farming practices
    path === '/no-pesticides' ||             // No pesticides guarantee
    path === '/animal-welfare' ||            // Animal welfare standards
    path === '/traceability' ||              // Product traceability
    
    // ========== CUSTOMER SUPPORT ==========
    path === '/contact' ||                   // Contact us
    path === '/contact-us' ||                // Contact us alternative
    path === '/support' ||                   // Support center
    path === '/help' ||                      // Help center
    path === '/faq' ||                       // Frequently asked questions
    path === '/faqs' ||                      // FAQs alternative
    path === '/customer-service' ||          // Customer service
    
    // ========== LEGAL & COMPLIANCE ==========
    path === '/terms' ||                     // Terms of service
    path === '/terms-of-service' ||          // Terms of service alternative
    path === '/terms-and-conditions' ||      // Terms and conditions
    path === '/privacy' ||                   // Privacy policy
    path === '/privacy-policy' ||            // Privacy policy alternative
    path === '/cookie-policy' ||             // Cookie policy
    path === '/refund-policy' ||             // Refund policy
    path === '/return-policy' ||             // Return policy
    path === '/cancellation-policy' ||       // Cancellation policy
    path === '/legal' ||                     // Legal information
    
    // ========== COMMUNITY & PARTNERSHIPS ==========
    path === '/testimonials' ||              // Customer testimonials
    path === '/reviews' ||                   // Customer reviews
    path === '/success-stories' ||           // Success stories
    path === '/partnerships' ||              // Partnership opportunities
    path === '/wholesale' ||                 // Wholesale information
    path === '/restaurants' ||               // For restaurants
    path === '/chefs' ||                     // For chefs
    path === '/farmers-market' ||            // Farmers market info
    path === '/community' ||                 // Community initiatives
    path === '/blog' ||                      // Blog
    path.startsWith('/blog/') ||             // Blog posts
    
    // ========== CART & CHECKOUT (PUBLIC PARTS) ==========
    path === '/cart' ||                      // Shopping cart (public viewing)
    path === '/cart/view' ||                 // View cart
    
    // ========== SPECIAL PAGES ==========
    path === '/sitemap' ||                   // Sitemap page
    path === '/site-map' ||                  // Site map alternative
    path === '/thank-you' ||                 // Thank you page
    path === '/confirmation' ||              // Order confirmation (public)
    path === '/newsletter' ||                // Newsletter signup
    path === '/subscribe' ||                 // Subscribe
    path === '/events' ||                    // Events
    path === '/workshops' ||                 // Workshops
    path === '/gift-cards' ||                // Gift cards
    
    // ========== API ROUTES (ALL ARE PUBLIC) ==========
    path.startsWith('/api/') ||
    
    // ========== STATIC ASSETS & FILES ==========
    path.startsWith('/_next/') ||            // Next.js internal files
    path.startsWith('/static/') ||           // Static files
    path.startsWith('/images/') ||           // Image files
    path.startsWith('/uploads/') ||          // Uploaded files
    path.startsWith('/files/') ||            // File downloads
    path.startsWith('/fonts/') ||            // Font files
    path.startsWith('/css/') ||              // CSS files
    path.startsWith('/js/') ||               // JavaScript files
    path.startsWith('/assets/') ||           // Assets
    path.startsWith('/public/') ||           // Public directory
    
    // ========== FILE EXTENSIONS (ALL FILES) ==========
    /\.[a-zA-Z0-9]+$/.test(path) ||          // Any file with extension
    
    // ========== COMMON FILES ==========
    path === '/favicon.ico' ||               // Favicon
    path === '/robots.txt' ||                // Robots file
    path === '/sitemap.xml' ||               // Sitemap XML
    path === '/sitemap-index.xml' ||         // Sitemap index
    path.startsWith('/sitemap-') ||          // Sitemap variations
    path === '/manifest.json' ||             // Web app manifest
    path === '/sw.js' ||                     // Service worker
    path === '/workbox-' ||                  // Workbox files
    path === '/humans.txt' ||                // Humans.txt
    path === '/ads.txt';                     // ads.txt
  
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
  
  // ========== PROTECT VENDOR ROUTES ==========
  if (path.startsWith('/vendor')) {
    // Redirect to login if no token
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    
    // Check if user is vendor or admin
    if (user?.role !== 'vendor' && user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Vendor/Admin is authenticated, allow access
    return NextResponse.next();
  }
  
  // ========== PROTECT USER ACCOUNT ROUTES ==========
  if (path.startsWith('/account') || 
      path.startsWith('/dashboard') ||
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
  
  // ========== PROTECT CHECKOUT ROUTES ==========
  if (path.startsWith('/checkout')) {
    // Redirect to login if no token
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      loginUrl.searchParams.set('message', 'Please login to checkout');
      return NextResponse.redirect(loginUrl);
    }
    
    // User is authenticated, allow access
    return NextResponse.next();
  }
  
  // ========== PROTECT ORDER HISTORY ROUTES ==========
  if (path.startsWith('/orders') && !path.startsWith('/orders/track')) {
    // /orders/track should be public for order tracking
    // but other order pages need authentication
    
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    
    return NextResponse.next();
  }
  
  // ========== PROTECT WISHLIST ROUTES ==========
  if (path.startsWith('/wishlist')) {
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      loginUrl.searchParams.set('message', 'Please login to save items to wishlist');
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
    // Redirect vendor to vendor dashboard
    else if (user?.role === 'vendor') {
      return NextResponse.redirect(new URL('/vendor/dashboard', request.url));
    }
    // Redirect regular user to account dashboard
    else {
      return NextResponse.redirect(new URL('/account/dashboard', request.url));
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
     * - sitemap.xml (already handled)
     * - robots.txt (already handled)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};