'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ShoppingCart, User, Search, Menu, X, Bell, Heart, Truck, Shield, Phone, LogIn, UserPlus, XCircle, Leaf, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, refreshUser, isLoading: authLoading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      fetchCartCount();
      fetchWishlistCount();
      fetchUnreadNotifications();
    } else {
      // Reset counts when not authenticated
      setCartCount(0);
      setWishlistCount(0);
      setUnreadNotifications(0);
      // Try to load cart from localStorage for guests
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
  }, [isAuthenticated, authLoading]);

  const fetchCartCount = async () => {
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
          const count = cartItems.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
          setCartCount(count);
        }
      } catch (e) {
        console.error('Failed to load cart from localStorage:', e);
      }
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await api.wishlist.getCount();
      setWishlistCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const response = await api.notifications.getUnreadCount();
      setUnreadNotifications(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

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

  // Prevent body scroll when mobile menu or search is open
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

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}>
        {/* Top Bar - Green Dominant */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white py-2">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between text-sm">
              {/* Left side - Info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-5 mb-2 md:mb-0">
                <div className="flex items-center space-x-1">
                  <Truck size={13} className="text-emerald-200" />
                  <span className="text-emerald-100 text-xs md:text-sm">Free Delivery over $50</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield size={13} className="text-emerald-200" />
                  <span className="text-emerald-100 text-xs md:text-sm">Secure Payments</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Phone size={13} className="text-emerald-200" />
                  <a href="tel:+254716354589" className="text-emerald-100 hover:text-white transition-colors text-xs md:text-sm">
                    +254 (716) 354-589
                  </a>
                </div>
              </div>

              {/* Right side - Auth & Quick Links */}
              <div className="flex items-center space-x-3 md:space-x-4">
                {!isAuthenticated ? (
                  <div className="flex items-center space-x-3">
                    <Link 
                      href="/auth/login" 
                      className="flex items-center space-x-1 text-emerald-100 hover:text-white transition-colors text-xs md:text-sm group"
                    >
                      <LogIn size={14} className="group-hover:scale-110 transition-transform" />
                      <span>Login</span>
                    </Link>
                    <span className="text-emerald-300">/</span>
                    <Link 
                      href="/auth/register" 
                      className="flex items-center space-x-1 text-white bg-emerald-800 hover:bg-emerald-900 px-3 py-1 rounded-full transition-colors text-xs md:text-sm group"
                    >
                      <UserPlus size={14} className="group-hover:scale-110 transition-transform" />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-100 text-xs md:text-sm">
                      Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                    </span>
                  </div>
                )}
                
                <span className="hidden md:inline text-emerald-300">|</span>
                
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/help" className="text-emerald-100 hover:text-white transition-colors text-xs md:text-sm">
                    Help Center
                  </Link>
                  <Link href="/track-order" className="text-emerald-100 hover:text-white transition-colors text-xs md:text-sm">
                    Track Order
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Search Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slideDown">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Search Products</h3>
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close search"
                  >
                    <XCircle size={24} className="text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="What are you looking for? Search fresh produce, dairy, meats..."
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
                    {['Organic Vegetables', 'Fresh Milk', 'Grass-fed Beef', 'Free-range Eggs', 'Artisanal Cheese', 'Seasonal Fruits'].map((item) => (
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

        {/* Main Header - Orange Dominant */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100/50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              {/* Logo & Mobile Menu */}
              <div className="flex items-center flex-shrink-0">
                <button
                  className="lg:hidden p-2 rounded-lg hover:bg-orange-200/30 transition-colors mr-2"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? <X size={24} className="text-orange-600" /> : <Menu size={24} className="text-orange-600" />}
                </button>
                <Link href="/" className="flex items-center group">
                  {/* Logo Container with Green-Orange Gradient Border */}
                  <div className="relative h-12 w-12 md:h-14 md:w-14 rounded-full overflow-hidden border-3 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-orange-300/20 to-amber-200/20"></div>
                    <Image
                      src="/logo.jpeg"
                      alt="Lando Ranch Logo"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                      sizes="(max-width: 768px) 48px, 56px"
                    />
                    {/* Small leaf accent */}
                    <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-emerald-500 to-orange-500 rounded-full p-0.5 shadow-sm">
                      <Leaf size={8} className="text-white" />
                    </div>
                  </div>
                  
                  {/* Logo Text with White, Orange, and Green */}
                  <div className="ml-3 md:ml-4">
                    <div className="relative">
                      {/* White shadow for depth */}
                      <div className="absolute -inset-0.5 bg-white/50 blur-sm opacity-50 rounded-lg"></div>
                      
                      {/* Main Logo Text */}
                      <h1 className="relative text-xl md:text-2xl font-bold italic transform -skew-x-6 leading-tight tracking-tight">
                        <span className="text-white bg-gradient-to-r from-emerald-600 to-emerald-500 px-1 rounded-l-md shadow-inner">
                          LANDO
                        </span>
                        <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 bg-clip-text text-transparent ml-1">
                          HYPERMARKET
                        </span>
                      </h1>
                      
                      {/* Gradient underline */}
                      <div className="h-0.5 w-full mt-0.5 bg-gradient-to-r from-emerald-400 via-orange-400 to-amber-400 rounded-full transform -skew-x-6 opacity-80"></div>
                    </div>
                    
                    {/* Tagline */}
                    <p className="text-xs text-gray-700 mt-1 italic flex items-center">
                      <Sparkles size={8} className="text-emerald-500 mr-1" />
                      <span className="bg-gradient-to-r from-emerald-600 to-orange-500 bg-clip-text text-transparent">
                        Fresh Farm & Grocery Delivery
                      </span>
                    </p>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation - Orange Dominant */}
              <nav className="hidden lg:flex items-center space-x-1 ml-8">
                <Link 
                  href="/" 
                  className={`px-4 py-2.5 font-medium text-base rounded-lg transition-all duration-200 ${
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
                  className={`px-4 py-2.5 font-medium text-base rounded-lg transition-all duration-200 ${
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
                  className={`px-4 py-2.5 font-medium text-base rounded-lg transition-all duration-200 ${
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
                  className={`px-4 py-2.5 font-medium text-base rounded-lg transition-all duration-200 ${
                    isActive('/deals') 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setActiveLink('/deals')}
                >
                  <span className="flex items-center space-x-1.5">
                    <span>Deals</span>
                    <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                      HOT
                    </span>
                  </span>
                </Link>
                <Link 
                  href="/support" 
                  className={`px-4 py-2.5 font-medium text-base rounded-lg transition-all duration-200 ${
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
              <div className="flex items-center space-x-3 md:space-x-4">
                {/* Search Icon */}
                <button 
                  className="p-2 rounded-lg hover:bg-orange-200/30 transition-colors group"
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search products"
                >
                  <div className="relative">
                    <Search size={20} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                  </div>
                </button>

                {/* Wishlist */}
                <Link 
                  href="/profile/wishlist" 
                  className="hidden lg:flex relative group p-2 rounded-lg hover:bg-orange-200/30 transition-colors"
                >
                  <Heart size={20} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                  {wishlistCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow">
                      {wishlistCount > 99 ? '99+' : wishlistCount}
                    </div>
                  )}
                </Link>

                {/* Cart */}
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

                {/* Notification & Profile */}
                {isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    {/* Notifications */}
                    <Link 
                      href="/profile/notifications" 
                      className="relative group p-2 rounded-lg hover:bg-orange-200/30 transition-colors"
                    >
                      <Bell size={20} className="text-gray-700 group-hover:text-orange-600 transition-colors" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold shadow">
                          {unreadNotifications > 9 ? '9+' : unreadNotifications}
                        </span>
                      )}
                    </Link>

                    {/* User Profile */}
                    <div className="relative">
                      <button
                        onClick={handleUserMenuClick}
                        className="flex items-center focus:outline-none group p-1 rounded-lg hover:bg-orange-200/30 transition-colors"
                        aria-label="User menu"
                      >
                        <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-orange-200 group-hover:border-orange-300 transition-colors shadow-sm">
                          {user?.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                              <User size={16} className="text-orange-600" />
                            </div>
                          )}
                        </div>
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 border border-orange-100 overflow-hidden z-50">
                          <div className="px-4 py-3 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                            <div className="font-medium text-gray-900 truncate">{user?.name}</div>
                            <div className="text-sm text-orange-600 truncate">{user?.email}</div>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/profile"
                              className="flex items-center px-4 py-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User size={16} className="mr-3 text-gray-400 group-hover:text-orange-500" />
                              My Profile
                            </Link>
                            <Link
                              href="/orders"
                              className="flex items-center px-4 py-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <ShoppingCart size={16} className="mr-3 text-gray-400 group-hover:text-orange-500" />
                              My Orders
                            </Link>
                            <Link
                              href="/profile/wishlist"
                              className="flex items-center px-4 py-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Heart size={16} className="mr-3 text-gray-400 group-hover:text-orange-500" />
                              Wishlist
                              {wishlistCount > 0 && (
                                <span className="ml-auto bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full">
                                  {wishlistCount}
                                </span>
                              )}
                            </Link>
                            {user?.role === 'admin' && (
                              <Link
                                href="/admin/dashboard"
                                className="flex items-center px-4 py-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <span className="mr-3 text-orange-500">👑</span>
                                Admin Dashboard
                              </Link>
                            )}
                            {user?.role === 'delivery_staff' && (
                              <Link
                                href="/delivery-staff/deliveries"
                                className="flex items-center px-4 py-2.5 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-colors group"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <span className="mr-3 text-orange-500">🚚</span>
                                Deliveries
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-orange-100 pt-1">
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors group"
                            >
                              <span className="mr-3">🚪</span>
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Show login button instead of empty profile area for non-authenticated users
                  <Link
                    href="/auth/login"
                    className="hidden md:flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all"
                  >
                    <LogIn size={16} className="mr-2" />
                    Login
                  </Link>
                )}
              </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="lg:hidden border-t border-orange-200 py-4 animate-slideDown">
                {/* Mobile Auth Status */}
                {isAuthenticated ? (
                  <div className="px-4 mb-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-100">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-orange-300">
                          {user?.avatar ? (
                            <Image
                              src={user.avatar}
                              alt={user.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                              <User size={18} className="text-orange-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user?.name?.split(' ')[0] || 'User'}</div>
                          <div className="text-sm text-orange-600">Welcome back!</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Mobile Search Icon */}
                        <button 
                          className="p-2 rounded-lg hover:bg-orange-100 transition-colors"
                          onClick={() => {
                            setSearchOpen(true);
                            setMobileMenuOpen(false);
                          }}
                          aria-label="Search"
                        >
                          <Search size={18} className="text-gray-600" />
                        </button>
                        
                        {isAuthenticated && (
                          <>
                            <Link 
                              href="/profile/notifications" 
                              className="relative p-2 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                              <Bell size={18} className="text-gray-600" />
                              {unreadNotifications > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                  {unreadNotifications}
                                </span>
                              )}
                            </Link>
                            <Link 
                              href="/cart" 
                              className="relative p-2 rounded-lg hover:bg-orange-100 transition-colors"
                            >
                              <ShoppingCart size={18} className="text-gray-600" />
                              {cartCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                                  {cartCount}
                                </span>
                              )}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 mb-4">
                    <div className="text-center text-sm text-orange-600 mb-2">Already have an account?</div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/auth/login"
                        className="px-4 py-2 text-center text-sm font-medium text-gray-700 border border-orange-300 rounded-lg hover:border-orange-400 hover:text-orange-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/auth/register"
                        className="px-4 py-2 text-center text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 shadow-sm transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}

                {/* Navigation Links */}
                <div className="flex flex-col space-y-1">
                  <Link
                    href="/"
                    className={`px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                      isActive('/')
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    onClick={() => {
                      setActiveLink('/');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Home
                  </Link>
                  <Link
                    href="/products"
                    className={`px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                      isActive('/products')
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    onClick={() => {
                      setActiveLink('/products');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Products
                  </Link>
                  <Link
                    href="/categories"
                    className={`px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                      isActive('/categories')
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    onClick={() => {
                      setActiveLink('/categories');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Categories
                  </Link>
                  <Link
                    href="/deals"
                    className={`px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                      isActive('/deals')
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    onClick={() => {
                      setActiveLink('/deals');
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="flex items-center justify-between">
                      <span>Deals</span>
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        HOT
                      </span>
                    </span>
                  </Link>
                  <Link
                    href="/support"
                    className={`px-4 py-3 text-base rounded-lg transition-all duration-200 ${
                      isActive('/support')
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                    onClick={() => {
                      setActiveLink('/support');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Support
                  </Link>
                </div>

                {/* Wishlist for mobile */}
                {isAuthenticated && (
                  <div className="mt-4 px-4">
                    <Link
                      href="/profile/wishlist"
                      className="flex items-center justify-between px-4 py-3 text-base text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="flex items-center">
                        <Heart size={18} className="mr-3 text-gray-400" />
                        My Wishlist
                      </span>
                      {wishlistCount > 0 && (
                        <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-0.5 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;