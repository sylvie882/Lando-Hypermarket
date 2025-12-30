'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ShoppingCart, User, Search, Menu, X, Bell, Heart, Truck, Shield, Phone, LogIn, UserPlus, XCircle, Leaf, Sparkles, ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveLink(window.location.pathname);
      
      const handleScroll = () => {
        setScrolled(window.scrollY > 10);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Fetch user data and counts
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated && !authLoading) {
          await Promise.all([
            fetchCartCount(),
            fetchWishlistCount(),
            fetchUnreadNotifications()
          ]);
        } else {
          // For non-authenticated users, load cart from localStorage
          try {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
              const cartItems = JSON.parse(savedCart);
              const count = cartItems.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
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
      try {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          const cartItems = JSON.parse(savedCart);
          const count = cartItems.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
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

  const fetchUnreadNotifications = useCallback(async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      setUnreadNotifications(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setSearchOpen(false);
    window.location.href = `/products?search=${encodeURIComponent(query)}`;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      setCartCount(0);
      setWishlistCount(0);
      setUnreadNotifications(0);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUserMenuClick = () => {
    if (isAuthenticated) {
      setUserMenuOpen(!userMenuOpen);
    } else {
      window.location.href = '/auth/login';
    }
  };

  const isActive = (path: string) => activeLink === path;

  // Handle body overflow
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen, searchOpen]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (userMenuOpen && !target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
      if (mobileMenuOpen && !target.closest('.mobile-menu-container') && !target.closest('.menu-toggle')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, mobileMenuOpen]);

  // Hide user menu on scroll
  useEffect(() => {
    const handleScrollClose = () => {
      if (userMenuOpen) {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollClose);
    return () => window.removeEventListener('scroll', handleScrollClose);
  }, [userMenuOpen]);

  return (
    <>
      <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}>
        {/* Top Bar - Green Dominant - Hidden on mobile */}
        <div className="hidden lg:block bg-gradient-to-r from-emerald-700 to-emerald-600 text-white py-2">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-sm">
              {/* Left side - Info */}
              <div className="flex items-center gap-5">
                <div className="flex items-center space-x-2">
                  <Truck size={14} className="text-emerald-200" />
                  <span className="text-emerald-100">Free Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield size={14} className="text-emerald-200" />
                  <span className="text-emerald-100">Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone size={14} className="text-emerald-200" />
                  <a href="tel:+254716354589" className="text-emerald-100 hover:text-white transition-colors">
                    +254 716 354589
                  </a>
                </div>
              </div>

              {/* Right side - Auth & Quick Links */}
              <div className="flex items-center space-x-5">
                {!isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <Link 
                      href="/auth/login" 
                      className="flex items-center space-x-2 text-emerald-100 hover:text-white transition-colors group text-sm"
                    >
                      <LogIn size={14} className="group-hover:scale-110 transition-transform" />
                      <span>Login</span>
                    </Link>
                    <span className="text-emerald-300">/</span>
                    <Link 
                      href="/auth/register" 
                      className="flex items-center space-x-2 text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded-full transition-colors text-sm group"
                    >
                      <UserPlus size={14} className="group-hover:scale-110 transition-transform" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-100 text-sm">
                      Hi, {user?.name?.split(' ')[0] || 'User'}!
                    </span>
                  </div>
                )}
                
                <span className="text-emerald-300">|</span>
                
                <div className="flex items-center space-x-4">
                  <Link href="/help" className="text-emerald-100 hover:text-white transition-colors text-sm">
                    Help Center
                  </Link>
                  <Link href="/track-order" className="text-emerald-100 hover:text-white transition-colors text-sm">
                    Track Order
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Search Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-start md:items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl animate-slideDown mt-16 md:mt-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Search Products</h3>
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close search"
                  >
                    <XCircle size={20} className="text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search fresh produce, dairy, meats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-14 text-lg border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-sm transition-all duration-300"
                    autoFocus
                    aria-label="Search products"
                  />
                  <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 shadow hover:shadow-md transition-all duration-300"
                    aria-label="Submit search"
                  >
                    Search
                  </button>
                </form>
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Popular Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Organic Vegetables', 'Fresh Milk', 'Grass-fed Beef', 'Free-range Eggs', 'Cheese', 'Fruits'].map((item) => (
                      <button
                        key={item}
                        onClick={() => handleQuickSearch(item)}
                        className="px-4 py-2 bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-600 rounded-full text-sm transition-colors"
                        type="button"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Header */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16 lg:h-20">
              {/* Logo & Mobile Menu Toggle */}
              <div className="flex items-center flex-shrink-0">
                <button
                  className="lg:hidden p-2 rounded-lg hover:bg-orange-200/30 transition-colors mr-2 menu-toggle z-50"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle mobile menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X size={22} className="text-orange-600" /> : <Menu size={22} className="text-orange-600" />}
                </button>
                
                {/* Logo Container - Main logo always visible */}
                <Link href="/" className="flex items-center group" onClick={() => setMobileMenuOpen(false)}>
                  {/* Logo Image */}
                  <div className="relative h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-orange-300/20 to-amber-200/20"></div>
                    <Image
                      src="/logo.jpeg"
                      alt="Lando Ranch Logo"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                      sizes="(max-width: 768px) 40px, 48px, 56px"
                    />
                    <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-emerald-500 to-orange-500 rounded-full p-0.5 shadow-sm">
                      <Leaf size={6} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Logo Text - Always visible */}
                  <div className="ml-3 lg:ml-4">
                    <div className="relative">
                      <h1 className="relative text-lg sm:text-xl lg:text-2xl font-bold italic transform -skew-x-6 leading-tight tracking-tight">
                        <span className="text-white bg-gradient-to-r from-emerald-600 to-emerald-500 px-1 rounded-l-md shadow-inner text-sm sm:text-base lg:text-lg">
                          Lando
                        </span>
                        <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent ml-0.5 text-sm sm:text-base lg:text-lg">
                          Hypermarket
                        </span>
                      </h1>
                      <div className="h-0.5 w-full mt-0.5 bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400 rounded-full transform -skew-x-6 opacity-80"></div>
                    </div>
                    {/* Tagline */}
                    {/* <p className="text-xs text-gray-700 mt-0.5 italic flex items-center">
                      <Sparkles size={6} className="text-emerald-500 mr-0.5" />
                      <span className="bg-gradient-to-r from-emerald-600 to-orange-500 bg-clip-text text-transparent">
                        Famous and renowned throughout the land
                      </span>
                    </p> */}
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-2 ml-8">
                <Link 
                  href="/" 
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    isActive('/') 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setActiveLink('/')}
                >
                  Home
                </Link>
                <Link 
                  href="/products" 
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    isActive('/products') 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setActiveLink('/products')}
                >
                  Products
                </Link>
                <Link 
                  href="/categories" 
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    isActive('/categories') 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setActiveLink('/categories')}
                >
                  Categories
                </Link>
                <Link 
                  href="/deals" 
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    isActive('/deals') 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setActiveLink('/deals')}
                >
                  <span className="flex items-center space-x-2">
                    <span>Deals</span>
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                      HOT
                    </span>
                  </span>
                </Link>
                <Link 
                  href="/support" 
                  className={`px-4 py-2 font-medium text-sm rounded-lg transition-all duration-200 ${
                    isActive('/support') 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setActiveLink('/support')}
                >
                  Support
                </Link>
              </nav>

              {/* User Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                {/* Search Icon */}
                <button 
                  className="p-2 rounded-lg hover:bg-orange-200/30 transition-colors group"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search products"
                >
                  <Search size={20} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                </button>

                {/* Wishlist - Desktop only */}
                <Link 
                  href="/profile/wishlist" 
                  className="hidden lg:flex relative group p-2 rounded-lg hover:bg-orange-200/30 transition-colors"
                >
                  <Heart size={20} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                  {wishlistCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </div>
                  )}
                </Link>

                {/* Cart - Always visible */}
                <Link 
                  href="/cart" 
                  className="relative group p-2 rounded-lg hover:bg-orange-200/30 transition-colors"
                >
                  <div className="relative">
                    <ShoppingCart size={22} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Notifications - Desktop only */}
                {isAuthenticated && (
                  <Link 
                    href="/profile/notifications" 
                    className="hidden lg:flex relative group p-2 rounded-lg hover:bg-orange-200/30 transition-colors"
                  >
                    <Bell size={20} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                    )}
                  </Link>
                )}

                {/* User Profile/Login - Desktop only */}
                <div className="relative user-menu-container hidden lg:block">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={handleUserMenuClick}
                        className="flex items-center focus:outline-none group p-1 rounded-lg hover:bg-orange-200/30 transition-colors"
                        aria-label="User menu"
                        aria-expanded={userMenuOpen}
                      >
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-orange-200 group-hover:border-orange-300 transition-colors shadow-sm">
                          {user?.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              fill
                              className="object-cover"
                              sizes="32px"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                              <User size={16} className="text-orange-600" />
                            </div>
                          )}
                        </div>
                        <ChevronDown size={12} className="ml-1 text-gray-500" />
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 border border-orange-100 overflow-hidden z-50 animate-fadeIn">
                          <div className="px-4 py-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                            <div className="font-medium text-gray-900 truncate">{user?.name}</div>
                            <div className="text-sm text-orange-600 truncate">{user?.email}</div>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User size={14} className="mr-3 text-gray-400 group-hover:text-orange-500" />
                              My Profile
                            </Link>
                            <Link
                              href="/orders"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <ShoppingCart size={14} className="mr-3 text-gray-400 group-hover:text-orange-500" />
                              My Orders
                            </Link>
                            <Link
                              href="/profile/wishlist"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Heart size={14} className="mr-3 text-gray-400 group-hover:text-orange-500" />
                              Wishlist
                              {wishlistCount > 0 && (
                                <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-1.5 py-0.5 rounded-full">
                                  {wishlistCount}
                                </span>
                              )}
                            </Link>
                            {user?.role === 'admin' && (
                              <Link
                                href="/admin/dashboard"
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <span className="mr-3 text-orange-500">👑</span>
                                Admin Dashboard
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-orange-100 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                            >
                              <span className="mr-3">🚪</span>
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href="/auth/login"
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all"
                    >
                      <LogIn size={14} className="mr-2" />
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Clean design without duplicate logo */}
      <div className={`lg:hidden mobile-menu-container fixed inset-0 z-40 transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-50' : 'opacity-0'}`}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Content - Clean design without duplicate logo */}
        <div 
          className={`absolute top-0 left-0 h-full w-80 sm:w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Simple Mobile Header - Just close button */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-orange-50 to-orange-100/50 border-b border-orange-200 p-4">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-orange-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={24} className="text-orange-600" />
              </button>
            </div>
          </div>

          {/* User Info Section */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-white">
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-orange-300">
                    {user?.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <User size={20} className="text-orange-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{user?.name}</div>
                    <div className="text-sm text-gray-500 truncate">{user?.email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/profile/notifications" 
                    className="relative p-2 rounded-lg hover:bg-orange-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell size={20} className="text-gray-600" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </Link>
                  <Link 
                    href="/profile/wishlist" 
                    className="relative p-2 rounded-lg hover:bg-orange-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart size={20} className="text-gray-600" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                  <Link 
                    href="/cart" 
                    className="relative p-2 rounded-lg hover:bg-orange-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart size={20} className="text-gray-600" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-600">Welcome to Lando Hypermarket</div>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/auth/login"
                    className="px-4 py-3 text-center text-sm font-medium text-gray-700 border border-orange-300 rounded-lg hover:border-orange-400 hover:text-orange-600 transition-colors flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={16} className="mr-2" />
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus size={16} className="mr-2" />
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-6">
            <div className="space-y-2">
              <Link
                href="/"
                className={`flex items-center px-4 py-3 text-base rounded-lg transition-all ${
                  isActive('/')
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-6 mr-3">🏠</span>
                Home
              </Link>
              <Link
                href="/products"
                className={`flex items-center px-4 py-3 text-base rounded-lg transition-all ${
                  isActive('/products')
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-6 mr-3">🛒</span>
                Products
              </Link>
              <Link
                href="/categories"
                className={`flex items-center px-4 py-3 text-base rounded-lg transition-all ${
                  isActive('/categories')
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-6 mr-3">📁</span>
                Categories
              </Link>
              <Link
                href="/deals"
                className={`flex items-center justify-between px-4 py-3 text-base rounded-lg transition-all ${
                  isActive('/deals')
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <span className="w-6 mr-3">🔥</span>
                  Deals
                </span>
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  HOT
                </span>
              </Link>
              <Link
                href="/support"
                className={`flex items-center px-4 py-3 text-base rounded-lg transition-all ${
                  isActive('/support')
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
                    : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="w-6 mr-3">💬</span>
                Support
              </Link>
            </div>

            {/* Additional Links */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-6 mr-3">❓</span>
                  Help Center
                </Link>
                <Link
                  href="/track-order"
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-6 mr-3">📦</span>
                  Track Order
                </Link>
                <div className="flex items-center px-4 py-2 text-gray-600">
                  <span className="w-6 mr-3">🚚</span>
                  Free Delivery
                </div>
                <div className="flex items-center px-4 py-2 text-gray-600">
                  <span className="w-6 mr-3">🔒</span>
                  Secure Payments
                </div>
                <a
                  href="tel:+254716354589"
                  className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="w-6 mr-3">📞</span>
                  +254 716 354589
                </a>
              </div>
            </div>

            {/* User Menu Links for authenticated users */}
            {isAuthenticated && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-3">My Account</h3>
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="w-6 mr-3">👤</span>
                    My Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="w-6 mr-3">📦</span>
                    My Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin/dashboard"
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="w-6 mr-3">👑</span>
                      Admin Dashboard
                    </Link>
                  )}
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full mt-4 px-4 py-3 text-red-600 hover:bg-red-50 border border-red-100 rounded-lg transition-colors flex items-center justify-center"
                >
                  <span className="w-6 mr-3">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Search Button at bottom */}
          <div className="sticky bottom-0 p-6 bg-white border-t border-gray-100">
            <button
              onClick={() => {
                setSearchOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center"
            >
              <Search size={18} className="mr-2" />
              Search Products
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;