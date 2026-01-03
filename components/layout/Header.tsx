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

  // Logo colors from description
  const logoColors = {
    dark: '#1a1a1a', // very dark charcoal
    greenLight: '#9dcc5e', // light green
    greenMedium: '#6a9c3d', // medium green
    gold: '#d4af37', // gold/beige
    orange: '#e67e22', // orange
    yellowGold: '#f1c40f', // yellow-gold highlight
    red: '#c0392b', // red
    lightGreenLine: '#a3d977', // light green line
  };

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

  // Handle body overflow - FIXED: Only hide overflow when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

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
      <style jsx global>{`
        .nav-link-hover:hover {
          background-color: ${logoColors.lightGreenLine}20;
        }
        .red-hover:hover {
          background-color: ${logoColors.red}10;
        }
        .category-hover:hover {
          background-color: ${logoColors.lightGreenLine}40;
          border-color: ${logoColors.greenLight};
        }
        .search-focus:focus {
          border-color: ${logoColors.greenMedium};
          box-shadow: 0 0 0 2px ${logoColors.greenLight}20;
        }
        .btn-gradient {
          background: linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight});
        }
        .btn-gradient:hover {
          background: linear-gradient(135deg, ${logoColors.greenMedium}dd, ${logoColors.greenLight}dd);
        }
      `}</style>

      <header className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
      }`}>
        {/* Top Bar - Updated with logo colors */}
        <div 
          className="hidden lg:block py-2"
          style={{ 
            background: logoColors.dark,
            color: 'white'
          }}
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Truck size={14} style={{ color: logoColors.orange }} />
                  <span style={{ color: logoColors.gold }}>Free Delivery Over Ksh 2000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: logoColors.orange }} />
                  <span style={{ color: logoColors.gold }}>Open 24/7</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {!isAuthenticated ? (
                  <div className="flex items-center gap-4">
                    <Link 
                      href="/auth/login" 
                      className="transition-colors flex items-center gap-2 hover:opacity-90"
                      style={{ color: logoColors.gold }}
                    >
                      <LogIn size={14} />
                      <span>Login</span>
                    </Link>
                    <span style={{ color: logoColors.greenMedium }}>|</span>
                    <Link 
                      href="/auth/register" 
                      className="transition-colors flex items-center gap-2 hover:opacity-90"
                      style={{ color: logoColors.orange }}
                    >
                      <UserPlus size={14} />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                ) : (
                  <span style={{ color: logoColors.gold }}>
                    Welcome back, <span style={{ color: logoColors.orange }}>{user?.name?.split(' ')[0] || 'User'}</span>
                  </span>
                )}
                
                <span style={{ color: logoColors.greenMedium }}>|</span>
                
                <div className="flex items-center gap-4">
                  <Link 
                    href="/help" 
                    className="transition-colors hover:opacity-90"
                    style={{ color: logoColors.gold }}
                  >
                    Help Center
                  </Link>
                  <Link 
                    href="/track-order" 
                    className="transition-colors hover:opacity-90"
                    style={{ color: logoColors.gold }}
                  >
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
                    <div 
                      className="absolute inset-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${logoColors.greenLight}20, ${logoColors.gold}20, ${logoColors.orange}20)`
                      }}
                    ></div>
                    <Image
                      src="/logo.jpeg"
                      alt="Lando Mart Logo"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                      sizes="48px"
                    />
                    <div 
                      className="absolute -top-1 -right-1 rounded-full p-1 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.gold})`
                      }}
                    >
                      <Leaf size={8} className="text-white" />
                    </div>
                  </div>
                  
                  <div className="ml-3">
                    <h1 className="text-md font-bold">
                      <span style={{ color: logoColors.greenMedium }}>Land</span>
                      <span style={{ color: logoColors.gold }}>o</span>
                      <br />
                      <span style={{ color: logoColors.red }}>Hypermarket</span>
                    </h1>
                    <div 
                      className="w-16 h-0.5 mt-1"
                      style={{ backgroundColor: logoColors.lightGreenLine }}
                    ></div>
                  </div>
                </Link>

                {/* All Categories Menu - Desktop */}
                <div className="hidden lg:block relative categories-menu-container">
                  <button
                    onClick={() => setCategoriesOpen(!categoriesOpen)}
                    className="flex items-center gap-2 px-5 py-3 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg btn-gradient"
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
                              className="category-hover p-4 rounded-xl border transition-all duration-300"
                              style={{
                                borderColor: logoColors.lightGreenLine,
                                backgroundColor: '#f9fafb'
                              }}
                              onClick={() => setCategoriesOpen(false)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-2xl">{category.icon}</span>
                                  <span 
                                    className="font-medium"
                                    style={{ color: logoColors.dark }}
                                  >
                                    {category.name}
                                  </span>
                                </div>
                                <ChevronRight 
                                  size={16} 
                                  style={{ color: logoColors.greenMedium }}
                                />
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {category.subcategories.slice(0, 2).map((sub) => (
                                  <span 
                                    key={sub} 
                                    className="px-2 py-1 text-xs rounded-lg"
                                    style={{
                                      backgroundColor: `${logoColors.lightGreenLine}40`,
                                      color: logoColors.greenMedium
                                    }}
                                  >
                                    {sub}
                                  </span>
                                ))}
                                {category.subcategories.length > 2 && (
                                  <span 
                                    className="px-2 py-1 text-xs rounded-lg"
                                    style={{
                                      backgroundColor: `${logoColors.lightGreenLine}40`,
                                      color: logoColors.greenMedium
                                    }}
                                  >
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
                              className="p-3 rounded-xl transition-all border hover:opacity-90 group"
                              style={{
                                background: `linear-gradient(135deg, ${logoColors.orange}15, ${logoColors.yellowGold}15)`,
                                borderColor: `${logoColors.orange}40`
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Tag size={14} style={{ color: logoColors.orange }} />
                                <span className="font-medium" style={{ color: logoColors.dark }}>Hot Deals</span>
                              </div>
                              <p className="text-xs" style={{ color: logoColors.greenMedium }}>Up to 50% off</p>
                            </Link>
                            <Link
                              href="/new-arrivals"
                              className="p-3 rounded-xl transition-all border hover:opacity-90 group"
                              style={{
                                background: `linear-gradient(135deg, ${logoColors.gold}15, ${logoColors.orange}15)`,
                                borderColor: `${logoColors.gold}40`
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Zap size={14} style={{ color: logoColors.gold }} />
                                <span className="font-medium" style={{ color: logoColors.dark }}>New Arrivals</span>
                              </div>
                              <p className="text-xs" style={{ color: logoColors.greenMedium }}>Fresh stocks</p>
                            </Link>
                            <Link
                              href="/best-sellers"
                              className="p-3 rounded-xl transition-all border hover:opacity-90 group"
                              style={{
                                background: `linear-gradient(135deg, ${logoColors.greenLight}15, ${logoColors.greenMedium}15)`,
                                borderColor: `${logoColors.greenLight}40`
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Award size={14} style={{ color: logoColors.greenMedium }} />
                                <span className="font-medium" style={{ color: logoColors.dark }}>Best Sellers</span>
                              </div>
                              <p className="text-xs" style={{ color: logoColors.greenMedium }}>Top rated</p>
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
                    className="search-focus w-full px-6 py-3.5 pl-14 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-300 shadow-sm"
                    style={{
                      borderColor: logoColors.lightGreenLine
                    }}
                  />
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: logoColors.greenMedium }} />
                  <button
                    type="submit"
                    className="btn-gradient absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 text-white rounded-lg font-medium shadow hover:shadow-md transition-all duration-300"
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
                  <Search size={22} style={{ color: logoColors.dark }} />
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  className="lg:hidden p-2.5 rounded-xl hover:bg-gray-100 transition-colors menu-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <Menu size={22} style={{ color: logoColors.dark }} />
                </button>

                {/* Desktop Actions */}
                <div className="hidden lg:flex items-center gap-2">
                  <Link 
                    href="/profile/wishlist" 
                    className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <Heart size={22} className="group-hover:text-rose-600" style={{ color: logoColors.dark }} />
                    {wishlistCount > 0 && (
                      <div 
                        className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow"
                        style={{
                          background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
                        }}
                      >
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </div>
                    )}
                  </Link>

                  <Link 
                    href="/cart" 
                    className="relative p-2.5 rounded-xl hover:bg-gray-100 transition-colors group"
                  >
                    <ShoppingCart size={22} className="group-hover:text-emerald-600" style={{ color: logoColors.dark }} />
                    {cartCount > 0 && (
                      <span 
                        className="absolute -top-1.5 -right-1.5 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md"
                        style={{
                          background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
                        }}
                      >
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
                          <div 
                            className="relative h-9 w-9 rounded-full overflow-hidden border-2"
                            style={{ borderColor: logoColors.lightGreenLine }}
                          >
                            {user?.avatar ? (
                              <Image
                                src={user.avatar}
                                alt={user.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div 
                                className="h-full w-full flex items-center justify-center"
                                style={{
                                  background: `linear-gradient(135deg, ${logoColors.greenLight}40, ${logoColors.gold}40)`
                                }}
                              >
                                <User size={18} style={{ color: logoColors.greenMedium }} />
                              </div>
                            )}
                          </div>
                        </button>

                        {userMenuOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl py-2 border border-gray-200 overflow-hidden z-50">
                            <div className="px-4 py-3 border-b border-gray-100">
                              <div className="font-medium" style={{ color: logoColors.dark }}>{user?.name}</div>
                              <div className="text-sm" style={{ color: logoColors.greenMedium }}>{user?.email}</div>
                            </div>
                            <div className="py-2">
                              <Link 
                                href="/profile" 
                                className="nav-link-hover flex items-center px-4 py-2 hover:text-emerald-600"
                                style={{ color: logoColors.dark }}
                              >
                                <User size={16} className="mr-3" />
                                My Profile
                              </Link>
                              <Link 
                                href="/orders" 
                                className="nav-link-hover flex items-center px-4 py-2 hover:text-emerald-600"
                                style={{ color: logoColors.dark }}
                              >
                                <Package size={16} className="mr-3" />
                                My Orders
                              </Link>
                              <Link 
                                href="/profile/wishlist" 
                                className="nav-link-hover flex items-center px-4 py-2 hover:text-emerald-600"
                                style={{ color: logoColors.dark }}
                              >
                                <Heart size={16} className="mr-3" />
                                Wishlist
                                {wishlistCount > 0 && (
                                  <span 
                                    className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `${logoColors.lightGreenLine}40`,
                                      color: logoColors.greenMedium
                                    }}
                                  >
                                    {wishlistCount}
                                  </span>
                                )}
                              </Link>
                              {user?.role === 'admin' && (
                                <Link 
                                  href="/admin/dashboard" 
                                  className="nav-link-hover flex items-center px-4 py-2 hover:text-emerald-600"
                                  style={{ color: logoColors.dark }}
                                >
                                  <Shield size={16} className="mr-3" />
                                  Admin Dashboard
                                </Link>
                              )}
                            </div>
                            <div className="border-t border-gray-100 pt-2">
                              <button 
                                onClick={handleLogout} 
                                className="red-hover flex items-center w-full px-4 py-2"
                                style={{ color: logoColors.red }}
                              >
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
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-xl shadow-sm transition-all btn-gradient"
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
                <Link 
                  href="/" 
                  className="nav-link-hover flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                  style={{ color: logoColors.dark }}
                >
                  <Home size={18} />
                  <span className="font-medium">Home</span>
                </Link>
                <Link 
                  href="/products" 
                  className="nav-link-hover flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                  style={{ color: logoColors.dark }}
                >
                  <Package size={18} />
                  <span className="font-medium">Products</span>
                </Link>
                <Link 
                  href="/deals" 
                  className="nav-link-hover flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                  style={{ color: logoColors.dark }}
                >
                  <Tag size={18} />
                  <span className="font-medium">Deals</span>
                  <span 
                    className="text-white text-xs px-2 py-0.5 rounded-full animate-pulse"
                    style={{
                      background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
                    }}
                  >
                    HOT
                  </span>
                </Link>
                <Link 
                  href="/new-arrivals" 
                  className="nav-link-hover flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                  style={{ color: logoColors.dark }}
                >
                  <Zap size={18} />
                  <span className="font-medium">New Arrivals</span>
                </Link>
                <Link 
                  href="/best-sellers" 
                  className="nav-link-hover flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                  style={{ color: logoColors.dark }}
                >
                  <Star size={18} />
                  <span className="font-medium">Best Sellers</span>
                </Link>
                <Link 
                  href="/support" 
                  className="nav-link-hover flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors"
                  style={{ color: logoColors.dark }}
                >
                  <HelpCircle size={18} />
                  <span className="font-medium">Support</span>
                </Link>
              </nav>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2" style={{ color: logoColors.greenMedium }}>
                  <Truck size={16} />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: logoColors.gold }}>
                  <Shield size={16} />
                  <span>100% Secure</span>
                </div>
                <a 
                  href="tel:+254716354589" 
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  style={{ color: logoColors.dark }}
                >
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
                  <h3 className="text-xl font-bold" style={{ color: logoColors.dark }}>Search Products</h3>
                  <button onClick={() => setSearchOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                    <XCircle size={20} style={{ color: logoColors.greenMedium }} />
                  </button>
                </div>
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search fresh produce, dairy, meats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-focus w-full px-6 py-4 pl-14 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 shadow-sm transition-all"
                    style={{
                      borderColor: logoColors.lightGreenLine
                    }}
                    autoFocus
                  />
                  <Search className="absolute left-4 top-4 h-6 w-6" style={{ color: logoColors.greenMedium }} />
                  <button 
                    type="submit" 
                    className="btn-gradient absolute right-2 top-2 px-6 py-2.5 text-white rounded-lg font-medium shadow hover:shadow-md transition-all"
                  >
                    Search
                  </button>
                </form>
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3" style={{ color: logoColors.greenMedium }}>Popular Searches</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Organic Vegetables', 'Fresh Milk', 'Grass-fed Beef', 'Free-range Eggs', 'Cheese', 'Fruits'].map((item) => (
                      <button
                        key={item}
                        onClick={() => handleQuickSearch(item)}
                        className="px-4 py-2 text-sm rounded-full transition-colors hover:opacity-90"
                        style={{
                          backgroundColor: `${logoColors.lightGreenLine}40`,
                          color: logoColors.greenMedium
                        }}
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

      {/* Mobile Menu - FIXED: No scrollable content issue */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60] mobile-menu-container">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div 
            className="absolute top-0 left-0 h-full w-80 sm:w-96 bg-white shadow-2xl animate-slideInLeft overflow-y-auto"
            style={{ maxHeight: '100vh' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold" style={{ color: logoColors.dark }}>Menu</h2>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={24} style={{ color: logoColors.greenMedium }} />
                </button>
              </div>

              {/* Categories in Mobile Menu */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4" style={{ color: logoColors.dark }}>Categories</h3>
                <div className="grid grid-cols-2 gap-3">
                  {categories.slice(0, 4).map((category) => (
                    <Link
                      key={category.name}
                      href={`/categories/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                      className="p-3 rounded-xl border transition-colors hover:bg-gray-50"
                      style={{
                        borderColor: logoColors.lightGreenLine
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{category.icon}</span>
                        <span className="font-medium text-sm" style={{ color: logoColors.dark }}>{category.name}</span>
                      </div>
                      <p className="text-xs" style={{ color: logoColors.greenMedium }}>{category.subcategories.length} items</p>
                    </Link>
                  ))}
                </div>
                <Link 
                  href="/categories" 
                  className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl border font-medium hover:opacity-90 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${logoColors.greenLight}15, ${logoColors.greenMedium}15)`,
                    borderColor: logoColors.lightGreenLine,
                    color: logoColors.greenMedium
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  View All Categories
                  <ChevronRight size={16} />
                </Link>
              </div>

              {/* Mobile Navigation Links */}
              <div className="space-y-2 mb-8">
                <Link 
                  href="/" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  style={{ color: logoColors.dark }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                <Link 
                  href="/products" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  style={{ color: logoColors.dark }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package size={20} />
                  <span>Products</span>
                </Link>
                <Link 
                  href="/deals" 
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 transition-colors"
                  style={{ color: logoColors.dark }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center gap-3">
                    <Tag size={20} />
                    <span>Deals</span>
                  </div>
                  <span 
                    className="text-white text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
                    }}
                  >
                    HOT
                  </span>
                </Link>
            
              </div>

              {/* Mobile User Actions */}
              <div className="space-y-4">
                {isAuthenticated ? (
                  <>
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 transition-colors"
                      style={{ color: logoColors.dark }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={20} />
                      <span>My Account</span>
                    </Link>
                    <Link 
                      href="/cart" 
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 transition-colors"
                      style={{ color: logoColors.dark }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingCart size={20} />
                        <span>Shopping Cart</span>
                      </div>
                      {cartCount > 0 && (
                        <span 
                          className="text-white text-xs px-2 py-1 rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
                          }}
                        >
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <button 
                      onClick={handleLogout} 
                      className="red-hover w-full flex items-center justify-center gap-3 p-3 rounded-xl border transition-colors"
                      style={{
                        color: logoColors.red,
                        borderColor: `${logoColors.red}40`
                      }}
                    >
                      <LogIn size={20} className="rotate-180" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link 
                      href="/auth/login" 
                      className="py-3 text-center rounded-xl border hover:opacity-90 transition-opacity"
                      style={{
                        color: logoColors.dark,
                        borderColor: logoColors.lightGreenLine
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="btn-gradient py-3 text-center text-white rounded-xl hover:opacity-90 transition-opacity"
                      onClick={() => setMobileMenuOpen(false)}
                    >
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