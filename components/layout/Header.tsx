'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  ShoppingCart, User, Search, Menu, X, Heart, Truck, 
  Phone, LogIn, ChevronDown, MapPin, Clock,
  Package, Star, Home, ChevronRight, Headphones, Tag,
  ShoppingBag, Gift, Shield, CreditCard, HelpCircle,
  Navigation, PhoneCall
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { debounce } from 'lodash';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();

  // Updated color scheme with specified greenMedium
  const colors = useMemo(() => ({
    primary: '#6a9c3d', // greenMedium from your request
    primaryLight: '#9dcc5e', // greenLight as light variant
    primaryDark: '#5a8a2d', // darker variant
    secondary: '#f59e0b', // amber-500
    secondaryLight: '#fbbf24', // amber-400
    secondaryDark: '#d97706', // amber-600
    accent: '#c0392b', // red
    accentLight: '#e67e22', // orange as light variant
    warning: '#f59e0b', // amber-500
    dark: '#1f2937', // gray-800
    light: '#ffffff',
    gray: '#9ca3af', // gray-400
    grayLight: '#f3f4f6' // gray-100
  }), []);

  // Categories data - memoized
  const categories = useMemo(() => [
    { 
      id: 'fruits-vegetables', 
      name: 'Fruits & Vegetables', 
      icon: '🥬',
      color: 'bg-green-100 text-green-700',
      subcategories: ['Fresh Fruits', 'Organic Vegetables', 'Salads & Herbs'] 
    },
    { 
      id: 'meat-seafood', 
      name: 'Meat & Seafood', 
      icon: '🍖',
      color: 'bg-red-100 text-red-700',
      subcategories: ['Chicken', 'Beef', 'Fish', 'Pork', 'Lamb'] 
    },
    { 
      id: 'dairy-eggs', 
      name: 'Dairy & Eggs', 
      icon: '🥛',
      color: 'bg-blue-100 text-blue-700',
      subcategories: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Eggs'] 
    },
    { 
      id: 'bakery', 
      name: 'Bakery', 
      icon: '🍞',
      color: 'bg-amber-100 text-amber-700',
      subcategories: ['Bread', 'Pastries', 'Cakes', 'Cookies'] 
    },
    { 
      id: 'beverages', 
      name: 'Beverages', 
      icon: '🥤',
      color: 'bg-cyan-100 text-cyan-700',
      subcategories: ['Juices', 'Soft Drinks', 'Tea & Coffee', 'Water'] 
    },
    { 
      id: 'snacks', 
      name: 'Snacks', 
      icon: '🍿',
      color: 'bg-orange-100 text-orange-700',
      subcategories: ['Chips', 'Chocolates', 'Nuts', 'Biscuits'] 
    },
    { 
      id: 'household', 
      name: 'Household', 
      icon: '🏠',
      color: 'bg-purple-100 text-purple-700',
      subcategories: ['Cleaning', 'Laundry', 'Paper Products'] 
    },
    { 
      id: 'personal-care', 
      name: 'Personal Care', 
      icon: '🧴',
      color: 'bg-pink-100 text-pink-700',
      subcategories: ['Shampoo', 'Skincare', 'Oral Care'] 
    },
  ], []);

  // Navigation links - memoized
  const navLinks = useMemo(() => [
    { id: 'home', name: 'Home', href: '/', icon: Home, badge: null },
    { id: 'shop', name: 'Shop', href: '/products', icon: ShoppingBag, badge: null },
    { id: 'deals', name: 'Deals', href: '/deals', icon: Tag, badge: 'HOT' },
    { id: 'new-arrivals', name: 'New', href: '/new-arrivals', icon: Gift, badge: 'NEW' },
    { id: 'best-sellers', name: 'Best', href: '/best-sellers', icon: Star, badge: null },
  ], []);

  // Mobile menu sections
  const mobileMenuSections = useMemo(() => [
    {
      title: 'Shop by Category',
      items: categories.slice(0, 8),
      type: 'categories'
    },
    {
      title: 'Services',
      items: [
        { id: 'delivery', name: 'Fast Delivery', icon: Truck, color: 'text-green-600' },
        { id: 'quality', name: 'Quality Guarantee', icon: Shield, color: 'text-blue-600' },
        { id: 'payment', name: 'Secure Payment', icon: CreditCard, color: 'text-purple-600' },
        { id: 'support', name: '24/7 Support', icon: PhoneCall, color: 'text-amber-600' }
      ],
      type: 'services'
    }
  ], [categories]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    // Throttle scroll events for performance
    const throttledScroll = debounce(handleScroll, 100);
    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      throttledScroll.cancel();
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle body overflow
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    };
  }, [mobileMenuOpen, searchOpen]);

  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Fetch user data and counts
  useEffect(() => {
    const fetchData = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
      try {
        if (isAuthenticated && !authLoading) {
          await Promise.all([
            fetchCartCount(),
            fetchWishlistCount()
          ]);
        } else {
          // Load from localStorage for guests
          try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
              const cartItems = JSON.parse(savedCart);
              const count = cartItems.reduce((total: number, item: any) => 
                total + (item.quantity || 1), 0);
              setCartCount(count);
            }
          } catch (e) {
            console.error('Failed to load cart from localStorage:', e);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  const fetchCartCount = useCallback(async () => {
    try {
      const response = await api.cart.getCount();
      setCartCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
      // Fallback to localStorage
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cartItems = JSON.parse(savedCart);
          const count = cartItems.reduce((total: number, item: any) => 
            total + (item.quantity || 1), 0);
          setCartCount(count);
        }
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
      }
    }
  }, []);

  const fetchWishlistCount = useCallback(async () => {
    try {
      const response = await api.wishlist.getCount();
      setWishlistCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setSearchOpen(false);
      setMobileMenuOpen(false);
      router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, router]);

  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/products?search=${encodeURIComponent(query)}`);
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      setCartCount(0);
      setWishlistCount(0);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Memoized user initials
  const userInitial = useMemo(() => 
    user?.name?.charAt(0).toUpperCase() || 'U', [user?.name]
  );

  // Memoized user first name
  const userFirstName = useMemo(() => 
    user?.name?.split(' ')[0] || 'User', [user?.name]
  );

  // Format cart count for display
  const displayCartCount = useMemo(() => 
    cartCount > 99 ? '99+' : cartCount, [cartCount]
  );

  // Check if link is active
  const isLinkActive = useCallback((href: string) => 
    pathname === href || pathname.startsWith(`${href}/`), [pathname]
  );

  // Quick search suggestions
  const quickSearches = useMemo(() => [
    'Milk', 'Bread', 'Eggs', 'Rice', 'Sugar', 'Cooking Oil',
    'Tomatoes', 'Onions', 'Potatoes', 'Chicken', 'Beef', 'Fish'
  ], []);

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slideInUp { animation: slideInUp 0.3s ease-out; }
        
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: ${colors.accent};
          color: white;
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .nav-underline {
          position: relative;
        }
        
        .nav-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 3px;
          background: ${colors.primary};
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        .nav-underline:hover::after {
          width: 100%;
        }
        
        .active-nav::after {
          width: 100%;
        }
        
        .sticky-header {
          position: sticky;
          top: 0;
          z-index: 50;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.95);
        }
        
        .search-overlay {
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.98) 100%);
          backdrop-filter: blur(10px);
        }
        
        .mobile-menu-overlay {
          background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(249,250,251,0.98) 100%);
          backdrop-filter: blur(10px);
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(229, 231, 235, 0.5);
        }
        
        .category-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .search-suggestion {
          transition: all 0.2s ease;
        }
        
        .search-suggestion:hover {
          transform: scale(1.05);
        }
      `}</style>

      {/* Top Banner - Desktop Only */}
      <div className="hidden lg:block bg-gradient-to-r from-green-700 via-green-600 to-green-700 text-white py-2 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between text-sm">
            {/* Left side: Store info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-amber-300 flex-shrink-0" />
                <span>Open 24/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck size={14} className="text-amber-300 flex-shrink-0" />
                <span>Free Delivery on orders over Ksh 2,000</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield size={14} className="text-amber-300 flex-shrink-0" />
                <span>100% Quality Guarantee</span>
              </div>
            </div>

            {/* Right side: User links */}
            <div className="flex items-center space-x-6">
              <Link 
                href="/store-locator" 
                className="hover:text-amber-200 transition-colors flex items-center space-x-1"
                aria-label="Find a store"
              >
                <Navigation size={14} />
                <span>Store Locator</span>
              </Link>
              <Link 
                href="/help" 
                className="hover:text-amber-200 transition-colors flex items-center space-x-1"
                aria-label="Get help"
              >
                <HelpCircle size={14} />
                <span>Help Center</span>
              </Link>
              
              {!isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/auth/login" 
                    className="hover:text-amber-200 transition-colors"
                    aria-label="Login to your account"
                  >
                    Login
                  </Link>
                  <span className="text-green-300" aria-hidden="true">/</span>
                  <Link 
                    href="/auth/register" 
                    className="hover:text-amber-200 transition-colors"
                    aria-label="Create an account"
                  >
                    Register
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="truncate max-w-[140px]">
                    Welcome, {userFirstName}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
      </div>

      {/* Main Header - Sticky */}
      <div className={`sticky-header ${scrolled ? 'shadow-lg' : 'shadow-sm'} transition-all duration-300`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* First Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between py-4">
            {/* Mobile Menu Toggle - Left Side */}
            <button 
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X size={24} className="text-gray-700" />
              ) : (
                <Menu size={24} className="text-gray-700" />
              )}
            </button>

            {/* Logo - Centered on mobile */}
            <div className="flex items-center mx-auto lg:mx-0">
              <Link href="/" className="flex items-center group" aria-label="Lando Hypermarket Home">
                <div className="flex items-center space-x-3">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-green-500 shadow-lg group-hover:shadow-green-200 transition-all duration-300">
                    <Image
                      src="/logo.jpeg"
                      alt="Lando Hypermarket Logo"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 48px, 48px"
                      priority
                      loading="eager"
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-2xl font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                      LANDO
                    </div>
                    <div className="text-sm font-semibold text-green-600 group-hover:text-green-700 transition-colors tracking-wide">
                      HYPERMARKET
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar - Centered */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full" role="search">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <input
                      type="search"
                      placeholder="Search for groceries, fruits, vegetables..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3.5 pl-14 bg-white border border-gray-300 rounded-l-xl focus:outline-none focus:ring-3 focus:ring-green-500/30 focus:border-green-500 placeholder-gray-500 transition-all duration-200"
                      style={{ borderRadius: '12px 0 0 12px' }}
                      aria-label="Search products"
                    />
                    <div className="absolute left-5 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-r-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 font-semibold border border-green-600 shadow-lg hover:shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    style={{ borderRadius: '0 12px 12px 0' }}
                    disabled={!searchQuery.trim()}
                    aria-label="Submit search"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3 md:space-x-4">
              {/* Mobile Search */}
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search size={22} className="text-gray-700" />
              </button>

              {/* Account */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                      aria-label="Account menu"
                      aria-expanded={userMenuOpen}
                    >
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-white font-bold text-base">
                          {userInitial}
                        </span>
                      </div>
                      <div className="hidden xl:block min-w-0">
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
                          My Account
                        </div>
                        <div className="text-xs text-gray-500 truncate">{userFirstName}</div>
                      </div>
                      <ChevronDown 
                        size={16} 
                        className={`text-gray-400 flex-shrink-0 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    
                    {userMenuOpen && (
                      <div 
                        className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-fadeIn glass-effect"
                        role="menu"
                        aria-label="User menu"
                      >
                        <div className="p-4 border-b border-gray-100">
                          <div className="font-semibold text-gray-900 truncate">{user?.name}</div>
                          <div className="text-sm text-gray-600 truncate">{user?.email}</div>
                        </div>
                        <div className="p-2">
                          <Link 
                            href="/profile" 
                            className="flex items-center px-3 py-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors group/item"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={18} className="mr-3 flex-shrink-0 text-gray-400 group-hover/item:text-green-600" />
                            <span>My Profile</span>
                          </Link>
                          <Link 
                            href="/orders" 
                            className="flex items-center px-3 py-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors group/item"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package size={18} className="mr-3 flex-shrink-0 text-gray-400 group-hover/item:text-green-600" />
                            <span>My Orders</span>
                          </Link>
                          <Link 
                            href="/profile/wishlist" 
                            className="flex items-center px-3 py-3 hover:bg-gray-50 rounded-lg text-gray-700 transition-colors group/item"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Heart size={18} className="mr-3 flex-shrink-0 text-gray-400 group-hover/item:text-green-600" />
                            <span className="flex-1">Wishlist</span>
                            {wishlistCount > 0 && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                {wishlistCount}
                              </span>
                            )}
                          </Link>
                          <div className="border-t border-gray-100 my-2"></div>
                          <button 
                            onClick={handleLogout}
                            className="flex items-center w-full px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium group/item"
                            role="menuitem"
                          >
                            <LogIn size={18} className="mr-3 rotate-180 flex-shrink-0 group-hover/item:text-red-700" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link 
                    href="/auth/login"
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                    aria-label="Login to your account"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                      <User size={20} className="text-gray-600 group-hover:text-green-600 transition-colors" />
                    </div>
                    <div className="hidden xl:block min-w-0">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                        Login
                      </div>
                      <div className="text-xs text-gray-500">Account / Register</div>
                    </div>
                  </Link>
                )}
              </div>

              {/* Wishlist */}
              <Link 
                href="/profile/wishlist" 
                className="hidden lg:block relative p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                aria-label={`Wishlist ${wishlistCount > 0 ? `with ${wishlistCount} items` : ''}`}
              >
                <div className="relative">
                  <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-red-100 transition-colors">
                    <Heart size={22} className="text-gray-600 group-hover:text-red-600 transition-colors" />
                  </div>
                  {wishlistCount > 0 && (
                    <div className="cart-badge">{wishlistCount}</div>
                  )}
                </div>
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 group"
                aria-label={`Shopping cart ${cartCount > 0 ? `with ${cartCount} items` : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <ShoppingCart size={24} className="text-green-700 group-hover:text-green-800 transition-colors" />
                    </div>
                    {cartCount > 0 && (
                      <div className="cart-badge">{displayCartCount}</div>
                    )}
                  </div>
                  <div className="hidden lg:block min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors truncate">
                      My Cart
                    </div>
                    <div className="text-sm text-gray-600 truncate">Ksh 0.00</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar - Always visible */}
          <div className="lg:hidden py-3 animate-slideInUp">
            <form onSubmit={handleSearch} className="relative" role="search">
              <div className="flex items-center">
                <div className="relative flex-1">
                  <input
                    type="search"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3.5 pl-12 bg-white border border-gray-300 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 placeholder-gray-500 transition-all duration-200"
                    style={{ borderRadius: '12px 0 0 12px' }}
                    aria-label="Search products"
                  />
                  <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-5 py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-r-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 border border-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  style={{ borderRadius: '0 12px 12px 0' }}
                  disabled={!searchQuery.trim()}
                  aria-label="Submit search"
                >
                  Go
                </button>
              </div>
            </form>
          </div>

          {/* Second Navigation Row - Desktop Only */}
          <div className="hidden lg:flex items-center justify-between py-3 border-t border-gray-100">
            {/* Categories Button */}
            <div className="relative" ref={categoriesMenuRef}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center space-x-3 px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl group"
                aria-label={categoriesOpen ? "Close categories" : "Open categories"}
                aria-expanded={categoriesOpen}
              >
                <Menu size={20} className="flex-shrink-0 group-hover:rotate-90 transition-transform" />
                <span className="font-semibold">ALL CATEGORIES</span>
                <ChevronDown 
                  size={16} 
                  className={`flex-shrink-0 transition-transform ${categoriesOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Categories Dropdown */}
              {categoriesOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-fadeIn glass-effect"
                  role="menu"
                  aria-label="Categories menu"
                >
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-gray-900">Browse Categories</h3>
                      <Link 
                        href="/categories" 
                        className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                        onClick={() => setCategoriesOpen(false)}
                      >
                        View all →
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/categories/${category.id}`}
                          className="category-card flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200 border border-gray-200 hover:border-green-300 group/category"
                          role="menuitem"
                          onClick={() => setCategoriesOpen(false)}
                        >
                          <div className="flex items-center space-x-4 min-w-0">
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center text-2xl ${category.color} bg-opacity-20 group-hover/category:bg-opacity-30 transition-all`}>
                              {category.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate group-hover/category:text-green-700 transition-colors">
                                {category.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {category.subcategories.slice(0, 2).join(', ')}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-gray-300 group-hover/category:text-green-500 transition-colors flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-8" aria-label="Main navigation">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`nav-underline text-gray-700 font-medium hover:text-green-600 transition-colors flex items-center space-x-2.5 ${isActive ? 'active-nav text-green-600 font-semibold' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className={`p-1.5 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'} group-hover:bg-green-100 transition-colors`}>
                      <Icon 
                        size={18} 
                        className={`${isActive ? 'text-green-600' : 'text-gray-500'} group-hover:text-green-600 transition-colors`} 
                      />
                    </div>
                    <span>{link.name}</span>
                    {link.badge && (
                      <span 
                        className={`text-xs px-2 py-1 rounded-full font-semibold ${
                          link.badge === 'HOT' 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                            : 'bg-gradient-to-r from-green-500 to-cyan-500 text-white'
                        }`}
                        aria-label={link.badge === 'HOT' ? "Hot deals" : "New arrivals"}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Contact Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-300 transition-all duration-200 group">
                <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                  <Headphones size={20} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-600 truncate">Need help? Call us</div>
                  <div className="text-sm font-bold text-gray-900 truncate group-hover:text-amber-700 transition-colors">
                    +254 716 354589
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="lg:hidden fixed inset-0 z-50 search-overlay">
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Search</h2>
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-all duration-200 active:scale-95"
                aria-label="Close search"
              >
                <X size={24} className="text-gray-700" />
              </button>
            </div>
            
            <form onSubmit={handleSearch} className="relative mb-8" role="search">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-5 py-4 pl-14 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:ring-3 focus:ring-green-500/30 focus:border-green-500 placeholder-gray-500 text-lg transition-all duration-200"
                  autoFocus
                  style={{ borderRadius: '16px' }}
                  aria-label="Search products"
                />
                <div className="absolute left-5 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:from-green-700 hover:to-green-600 transition-all duration-300 border border-green-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  disabled={!searchQuery.trim()}
                  aria-label="Submit search"
                >
                  Search
                </button>
              </div>
            </form>
            
            <div className="flex-1 overflow-y-auto">
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <span>Popular Searches</span>
                  <div className="ml-2 h-1 flex-1 bg-gradient-to-r from-green-500 to-transparent rounded-full"></div>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleQuickSearch(item)}
                      className="search-suggestion px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      aria-label={`Search for ${item}`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 text-lg flex items-center">
                  <span>Recent Searches</span>
                  <div className="ml-2 h-1 flex-1 bg-gradient-to-r from-amber-500 to-transparent rounded-full"></div>
                </h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-between">
                    <span className="text-gray-700">Fresh Milk</span>
                    <X size={16} className="text-gray-400" />
                  </button>
                  <button className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex items-center justify-between">
                    <span className="text-gray-700">Organic Vegetables</span>
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu - Opens from LEFT */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div 
            className="absolute inset-0 bg-black/30" 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-sm bg-white shadow-2xl animate-slideInLeft">
            <div className="h-full flex flex-col">
              {/* Menu Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-green-500">
                      <Image
                        src="/logo.jpeg"
                        alt="Lando Hypermarket Logo"
                        fill
                        className="object-cover"
                        sizes="48px"
                        loading="eager"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">LANDO</div>
                      <div className="text-xs text-green-600 font-semibold">HYPERMARKET</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                    aria-label="Close menu"
                  >
                    <X size={24} className="text-gray-700" />
                  </button>
                </div>

                {/* User Section */}
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                      <div className="h-14 w-14 rounded-xl bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center flex-shrink-0 shadow-md">
                        <span className="text-white font-bold text-xl">
                          {userInitial}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{user?.name}</div>
                        <div className="text-sm text-green-600 truncate">{user?.email}</div>
                        <Link 
                          href="/profile" 
                          className="text-xs font-medium text-green-700 hover:text-green-800 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-700 font-medium text-center">Welcome to Lando Hypermarket</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Link 
                          href="/auth/login" 
                          className="py-3 text-center border-2 border-green-600 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 active:scale-95"
                          onClick={() => setMobileMenuOpen(false)}
                          aria-label="Login to your account"
                        >
                          Login
                        </Link>
                        <Link 
                          href="/auth/register" 
                          className="py-3 text-center bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-600 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                          onClick={() => setMobileMenuOpen(false)}
                          aria-label="Create an account"
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Link 
                    href="/cart" 
                    className="p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition-colors flex items-center space-x-2 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      <ShoppingCart size={20} className="text-gray-600 group-hover:text-green-600" />
                      {cartCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {displayCartCount}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-green-700">Cart</span>
                  </Link>
                  <Link 
                    href="/profile/wishlist" 
                    className="p-3 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors flex items-center space-x-2 group"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      <Heart size={20} className="text-gray-600 group-hover:text-red-600" />
                      {wishlistCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {wishlistCount}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-red-700">Wishlist</span>
                  </Link>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Mobile Navigation */}
                <nav className="p-6 border-b border-gray-100">
                  <h3 className="font-semibold mb-4 text-gray-900 text-lg">Quick Links</h3>
                  <div className="space-y-1">
                    {navLinks.map((link) => {
                      const Icon = link.icon;
                      const isActive = isLinkActive(link.href);
                      return (
                        <Link 
                          key={link.id}
                          href={link.href} 
                          className={`flex items-center justify-between py-3 px-3 rounded-xl transition-colors ${isActive ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50'}`}
                          onClick={() => setMobileMenuOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon 
                              size={20} 
                              className={`${isActive ? 'text-green-600' : 'text-gray-500'}`} 
                            />
                            <span className={`font-medium ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                              {link.name}
                            </span>
                          </div>
                          {link.badge && (
                            <span 
                              className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                link.badge === 'HOT' 
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                                  : 'bg-gradient-to-r from-green-500 to-cyan-500 text-white'
                              }`}
                            >
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                {/* Menu Sections */}
                {mobileMenuSections.map((section, idx) => (
                  <div key={idx} className="p-6 border-b border-gray-100 last:border-b-0">
                    <h3 className="font-semibold mb-4 text-gray-900 text-lg">{section.title}</h3>
                    <div className={`grid grid-cols-2 gap-3 ${section.type === 'services' ? 'grid-cols-2' : ''}`}>
                      {section.items.map((item: any) => (
                        <Link
                          key={item.id}
                          href={section.type === 'categories' ? `/categories/${item.id}` : `/${item.id}`}
                          className="p-4 bg-gray-50 hover:bg-white border border-gray-200 hover:border-green-300 rounded-xl transition-all duration-200 hover:shadow-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {section.type === 'categories' ? (
                            <>
                              <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-2xl mb-2 ${item.color} bg-opacity-20`}>
                                {item.icon}
                              </div>
                              <div className="font-medium text-gray-900 text-sm truncate">{item.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{item.subcategories.length} items</div>
                            </>
                          ) : (
                            <>
                              <div className="mb-2">
                                <item.icon size={20} className={item.color} />
                              </div>
                              <div className="font-medium text-gray-900 text-sm truncate">{item.name}</div>
                            </>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Account Links for logged in users */}
                {isAuthenticated && (
                  <div className="p-6 border-t border-gray-100">
                    <h3 className="font-semibold mb-4 text-gray-900 text-lg">Account</h3>
                    <div className="space-y-1">
                      <Link 
                        href="/orders" 
                        className="flex items-center py-3 px-3 hover:bg-gray-50 rounded-xl text-gray-700 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package size={20} className="mr-3 text-gray-500" />
                        <span>My Orders</span>
                      </Link>
                      <Link 
                        href="/profile/settings" 
                        className="flex items-center py-3 px-3 hover:bg-gray-50 rounded-xl text-gray-700 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={20} className="mr-3 text-gray-500" />
                        <span>Account Settings</span>
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full py-3 px-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors mt-4"
                      >
                        <LogIn size={20} className="mr-3 rotate-180" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <PhoneCall size={16} />
                    <span>24/7 Support: +254 716 354589</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Truck size={16} />
                    <span>Free Delivery over Ksh 2,000</span>
                  </div>
                  <div className="pt-4">
                    <Link 
                      href="/help" 
                      className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Need Help? Visit Help Center →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;