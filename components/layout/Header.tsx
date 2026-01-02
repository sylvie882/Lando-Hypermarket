'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { ShoppingCart, User, Search, Menu, X, Bell, Heart, Truck, Shield, Phone, LogIn, UserPlus, XCircle, Leaf, Sparkles, ChevronDown, ChevronRight, Home, Package, Tag, HelpCircle, Star, Award, Clock, Zap } from 'lucide-react';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Categories data
  const categories = [
    { name: 'Fruits & Vegetables', icon: '🥬', subcategories: ['Fresh Fruits', 'Organic Vegetables', 'Salads & Herbs'] },
    { name: 'Meat & Seafood', icon: '🍖', subcategories: ['Chicken', 'Beef', 'Fish', 'Pork', 'Lamb'] },
    { name: 'Dairy & Eggs', icon: '🥛', subcategories: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Eggs'] },
    { name: 'Bakery', icon: '🍞', subcategories: ['Bread', 'Pastries', 'Cakes', 'Cookies'] },
    { name: 'Beverages', icon: '🥤', subcategories: ['Juices', 'Soft Drinks', 'Tea & Coffee', 'Water'] },
    { name: 'Snacks', icon: '🍿', subcategories: ['Chips', 'Chocolates', 'Nuts', 'Biscuits'] },
    { name: 'Household', icon: '🏠', subcategories: ['Cleaning', 'Laundry', 'Paper Products'] },
    { name: 'Personal Care', icon: '🧴', subcategories: ['Shampoo', 'Skincare', 'Oral Care'] },
  ];

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
      if (categoriesOpen && !target.closest('.categories-menu-container')) {
        setCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen, mobileMenuOpen, categoriesOpen]);

  // Hide user menu on scroll
  useEffect(() => {
    const handleScrollClose = () => {
      if (userMenuOpen) {
        setUserMenuOpen(false);
      }
      if (categoriesOpen) {
        setCategoriesOpen(false);
      }
    };

    window.addEventListener('scroll', handleScrollClose);
    return () => window.removeEventListener('scroll', handleScrollClose);
  }, [userMenuOpen, categoriesOpen]);

  return (
    <>
      <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}>
        {/* Top Bar - Modern Minimalist */}
        <div className="hidden lg:block bg-gradient-to-r from-gray-900 to-gray-800 text-white py-2">
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-emerald-400" />
                  <span className="text-gray-300">Free Delivery Over Ksh 2000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-emerald-400" />
                  <span className="text-gray-300">Open 24/7</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {!isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <Link 
                      href="/auth/login" 
                      className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <LogIn size={14} />
                      <span>Login</span>
                    </Link>
                    <span className="text-gray-500">|</span>
                    <Link 
                      href="/auth/register" 
                      className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2"
                    >
                      <UserPlus size={14} />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                ) : (
                  <span className="text-gray-300">
                    Welcome back, <span className="text-emerald-400">{user?.name?.split(' ')[0] || 'User'}</span>
                  </span>
                )}
                
                <span className="text-gray-500">|</span>
                
                <div className="flex items-center gap-4">
                  <Link href="/help" className="text-gray-300 hover:text-white transition-colors">
                    Help Center
                  </Link>
                  <Link href="/track-order" className="text-gray-300 hover:text-white transition-colors">
                    Track Order
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="border-b border-gray-100 bg-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-20">
              {/* Logo & Categories Menu */}
              <div className="flex items-center gap-8">
                {/* Logo */}
                <Link href="/" className="flex items-center group">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-blue-300/20 to-purple-200/20"></div>
                    <Image
                      src="/logo.jpeg"
                      alt="Lando Mart Logo"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                      sizes="48px"
                    />
                    <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full p-1 shadow-sm">
                      <Leaf size={8} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      LANDO RANCH<span className="text-emerald-600">LTD</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-0.5">LANDO HYPERMARKET</p>
                  </div>
                </Link>

                {/* All Categories Menu - Desktop */}
                <div className="hidden lg:block relative categories-menu-container">
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Menu size={20} />
                    <span className="font-medium">All Categories</span>
                    <ChevronDown size={16} className={`transition-transform duration-300 ${categoriesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Categories Dropdown */}
                  {categoriesOpen && (
                    <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-gray-900">Browse Categories</h3>
                          <button
                            onClick={() => setCategoriesOpen(false)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <X size={18} className="text-gray-500" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map((category) => (
                            <Link
                              key={category.name}
                              href={`/categories/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                              className="group p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all duration-300"
                              onClick={() => setCategoriesOpen(false)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{category.icon}</span>
                                  <span className="font-medium text-gray-900 group-hover:text-emerald-700">
                                    {category.name}
                                  </span>
                                </div>
                                <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500" />
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {category.subcategories.slice(0, 2).map((sub) => (
                                  <span key={sub} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-lg group-hover:bg-emerald-100 group-hover:text-emerald-700">
                                    {sub}
                                  </span>
                                ))}
                                {category.subcategories.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-lg">
                                    +{category.subcategories.length - 2} more
                                  </span>
                                )}
                              </div>
                            </Link>
                          ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <div className="grid grid-cols-3 gap-4">
                            <Link
                              href="/deals"
                              className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl hover:from-orange-100 hover:to-amber-100 transition-all border border-orange-100 group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Tag size={14} className="text-orange-600" />
                                <span className="font-medium text-gray-900">Hot Deals</span>
                              </div>
                              <p className="text-xs text-gray-600">Up to 50% off</p>
                            </Link>
                            <Link
                              href="/new-arrivals"
                              className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all border border-blue-100 group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Zap size={14} className="text-blue-600" />
                                <span className="font-medium text-gray-900">New Arrivals</span>
                              </div>
                              <p className="text-xs text-gray-600">Fresh stocks</p>
                            </Link>
                            <Link
                              href="/best-sellers"
                              className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl hover:from-emerald-100 hover:to-teal-100 transition-all border border-emerald-100 group"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Award size={14} className="text-emerald-600" />
                                <span className="font-medium text-gray-900">Best Sellers</span>
                              </div>
                              <p className="text-xs text-gray-600">Top rated</p>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Bar - Desktop */}
              <div className="hidden lg:block flex-1 max-w-2xl mx-8">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search for groceries, fruits, vegetables, dairy..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-3.5 pl-14 bg-gray-50 border border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all duration-300 shadow-sm"
                  />
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-600 shadow hover:shadow-md transition-all duration-300"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-4">
                {/* Search Icon - Mobile */}
                <button 
                  className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search size={22} className="text-gray-700" />
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu size={22} className="text-gray-700" />
                </button>

                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-2">
                  <Link 
                    href="/profile/wishlist" 
                    className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <Heart size={22} className="text-gray-700 group-hover:text-rose-600" />
                    {wishlistCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </div>
                    )}
                  </Link>

                  <Link 
                    href="/cart" 
                    className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <ShoppingCart size={22} className="text-gray-700 group-hover:text-emerald-600" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>

                  {/* User Profile */}
                  <div className="relative user-menu-container">
                    {isAuthenticated ? (
                      <>
                        <button
                          onClick={handleUserMenuClick}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="relative h-9 w-9 rounded-full overflow-hidden border-2 border-emerald-200">
                            {user?.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                <User size={18} className="text-emerald-600" />
                              </div>
                            )}
                          </div>
                        </button>

                        {userMenuOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-200 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                              <div className="font-medium text-gray-900">{user?.name}</div>
                              <div className="text-sm text-gray-500">{user?.email}</div>
                            </div>
                            <div className="py-2">
                              <Link href="/profile" className="flex items-center px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50">
                                <User size={16} className="mr-3" />
                                My Profile
                              </Link>
                              <Link href="/orders" className="flex items-center px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50">
                                <Package size={16} className="mr-3" />
                                My Orders
                              </Link>
                              <Link href="/profile/wishlist" className="flex items-center px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50">
                                <Heart size={16} className="mr-3" />
                                Wishlist
                                {wishlistCount > 0 && (
                                  <span className="ml-auto bg-emerald-100 text-emerald-600 text-xs px-1.5 py-0.5 rounded-full">
                                    {wishlistCount}
                                  </span>
                                )}
                              </Link>
                              {user?.role === 'admin' && (
                                <Link href="/admin/dashboard" className="flex items-center px-4 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50">
                                  <Shield size={16} className="mr-3" />
                                  Admin Dashboard
                                </Link>
                              )}
                            </div>
                            <div className="border-t border-gray-100 pt-2">
                              <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-rose-600 hover:bg-rose-50">
                                <LogIn size={16} className="mr-3 rotate-180" />
                                Logout
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href="/auth/login"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-700 hover:to-emerald-600 shadow-sm transition-all"
                      >
                        <LogIn size={16} />
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center justify-between py-3 border-t border-gray-100">
              <nav className="flex items-center gap-1">
                <Link href="/" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <Home size={18} />
                  <span className="font-medium">Home</span>
                </Link>
                <Link href="/products" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <Package size={18} />
                  <span className="font-medium">Products</span>
                </Link>
                <Link href="/deals" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <Tag size={18} />
                  <span className="font-medium">Deals</span>
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                    HOT
                  </span>
                </Link>
                <Link href="/new-arrivals" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <Zap size={18} />
                  <span className="font-medium">New Arrivals</span>
                </Link>
                <Link href="/best-sellers" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <Star size={18} />
                  <span className="font-medium">Best Sellers</span>
                </Link>
                <Link href="/support" className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
                  <HelpCircle size={18} />
                  <span className="font-medium">Support</span>
                </Link>
              </nav>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-emerald-600">
                  <Truck size={16} />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <Shield size={16} />
                  <span>100% Secure</span>
                </div>
                <a href="tel:+254716354589" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600">
                  <Phone size={16} />
                  <span>+254 716 354589</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Popup Search Overlay */}
        {searchOpen && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-start md:items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-slideDown mt-16 md:mt-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Search Products</h3>
                  <button onClick={() => setSearchOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                    <XCircle size={20} className="text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search fresh produce, dairy, meats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pl-14 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 shadow-sm transition-all"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
                  <button type="submit" className="absolute right-2 top-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-emerald-600 shadow hover:shadow-md transition-all">
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
                        className="px-4 py-2 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-600 rounded-full text-sm transition-colors"
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
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-80 sm:w-96 bg-white shadow-2xl animate-slideInLeft">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X size={24} className="text-gray-500" />
                </button>
              </div>

              {/* Categories in Mobile Menu */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.slice(0, 4).map((category) => (
                    <Link
                      key={category.name}
                      href={`/categories/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                      className="p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium text-gray-900 text-sm">{category.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{category.subcategories.length} items</p>
                    </Link>
                  ))}
                </div>
                <Link 
                  href="/categories" 
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 text-emerald-700 font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  View All Categories
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-2 mb-8">
                <Link href="/" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                <Link href="/products" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                  <Package size={20} />
                  <span>Products</span>
                </Link>
                <Link href="/deals" className="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3">
                    <Tag size={20} />
                    <span>Deals</span>
                  </div>
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full">
                    HOT
                  </span>
                </Link>
                <Link href="/new-arrivals" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                  <Zap size={20} />
                  <span>New Arrivals</span>
                </Link>
              </div>

              {/* Mobile User Actions */}
              <div className="space-y-4">
                {isAuthenticated ? (
                  <>
                    <Link href="/profile" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                      <User size={20} />
                      <span>My Account</span>
                    </Link>
                    <Link href="/cart" className="flex items-center justify-between p-3 text-gray-700 hover:bg-gray-100 rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                      <div className="flex items-center gap-3">
                        <ShoppingCart size={20} />
                        <span>Shopping Cart</span>
                      </div>
                      {cartCount > 0 && (
                        <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-3 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-100">
                      <LogIn size={20} className="rotate-180" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link href="/auth/login" className="py-3 text-center text-gray-700 border border-gray-200 rounded-xl hover:border-emerald-300" onClick={() => setMobileMenuOpen(false)}>
                      Login
                    </Link>
                    <Link href="/auth/register" className="py-3 text-center text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl hover:from-emerald-700 hover:to-emerald-600" onClick={() => setMobileMenuOpen(false)}>
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;