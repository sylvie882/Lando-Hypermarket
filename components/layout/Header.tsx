'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  ShoppingCart, User, Search, Menu, X, Heart, Truck, 
  Phone, LogIn, UserPlus, ChevronDown, MapPin, Clock,
  Package, Star, Home, ChevronRight, Headphones, Tag
} from 'lucide-react';

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

  // Color scheme
  const colors = {
    green: '#27ae60',
    greenLight: '#2ecc71',
    greenDark: '#229954',
    orange: '#e67e22',
    orangeLight: '#f39c12',
    orangeDark: '#d35400',
    red: '#e74c3c',
    yellow: '#f1c40f',
    dark: '#2c3e50',
    light: '#f8f9fa'
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

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Shop', href: '/products', icon: Package },
    { name: 'Deals', href: '/deals', icon: Tag },
    { name: 'New Arrivals', href: '/new-arrivals', icon: Star },
    { name: 'Best Sellers', href: '/best-sellers', icon: Star },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch user data and counts
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated && !authLoading) {
          await Promise.all([
            fetchCartCount(),
            fetchWishlistCount()
          ]);
        } else {
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
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };
  
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
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
          
          .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
          .animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
          
          .cart-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: ${colors.red};
            color: white;
            font-size: 10px;
            font-weight: bold;
            min-width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
          }
          
          .nav-underline {
            position: relative;
          }
          
          .nav-underline::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background: ${colors.green};
            transition: width 0.3s ease;
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
            z-index: 100;
            transition: all 0.3s ease;
          }
        `}</style>
  
        {/* Top Green Navbar */}
        <div className="sticky-header bg-gradient-to-r from-green-600 to-green-500 text-white py-2">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between text-sm">
              {/* Left side: Store info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Clock size={14} className="text-yellow-300" />
                  <span className="hidden sm:inline">Open 24/7</span>
                </div>
                <div className="hidden md:flex items-center space-x-2">
                  <Truck size={14} className="text-yellow-300" />
                  <span>Free Delivery on orders over Ksh 2,000</span>
                </div>
              </div>
  
              {/* Right side: User links */}
              <div className="flex items-center space-x-4">
                <Link href="/store-locator" className="hidden sm:inline hover:text-yellow-200 text-xs md:text-sm">
                  Store Locator
                </Link>
                <Link href="/help" className="hidden sm:inline hover:text-yellow-200 text-xs md:text-sm">
                  Help Center
                </Link>
                
                {!isAuthenticated ? (
                  <div className="flex items-center space-x-2">
                    <Link href="/auth/login" className="hover:text-yellow-200 text-xs md:text-sm">
                      Login
                    </Link>
                    <span className="text-green-300">/</span>
                    <Link href="/auth/register" className="hover:text-yellow-200 text-xs md:text-sm">
                      Register
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm">Welcome, {user?.name?.split(' ')[0] || 'User'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  
        {/* Main Header - Sticky */}
        <div className={`sticky-header bg-white ${scrolled ? 'shadow-lg' : 'shadow-sm'} transition-shadow duration-300`}>
          <div className="max-w-7xl mx-auto px-4">
            {/* First Row: Logo, Search, Actions */}
            <div className="flex items-center justify-between py-3">
              {/* Mobile Menu Toggle - Left Side */}
              <button 
                className="lg:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} className="text-orange-600" /> : <Menu size={24} className="text-orange-600" />}
              </button>
  
              {/* Logo - Centered on mobile */}
              <div className="flex items-center mx-auto lg:mx-0">
                <Link href="/" className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-orange-500 shadow-md">
                      <Image
                        src="/logo.jpeg"
                        alt="Lando Hypermarket Logo"
                        fill
                        className="object-cover"
                        sizes="48px"
                        priority
                      />
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-green-700">LANDO</div>
                      <div className="text-xs md:text-sm font-semibold text-orange-600">HYPERMARKET</div>
                    </div>
                  </div>
                </Link>
              </div>
  
              {/* Desktop Search Bar - Centered */}
              <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
                <form onSubmit={handleSearch} className="relative w-full">
                  <div className="flex items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Search for groceries, fruits, vegetables..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-green-300 rounded-l-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        style={{ borderRadius: '16px 0 0 16px' }}
                      />
                      <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center">
                        <Search className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-r-2xl hover:from-orange-700 hover:to-orange-600 transition-all duration-300 font-medium border border-orange-600 shadow-md"
                      style={{ borderRadius: '0 16px 16px 0' }}
                    >
                      Search
                    </button>
                  </div>
                </form>
              </div>
  
              {/* Right Side Actions */}
              <div className="flex items-center space-x-2 md:space-x-4">
                {/* Mobile Search */}
                <button 
                  className="lg:hidden p-2"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search size={22} className="text-green-600" />
                </button>
  
                {/* Location - Desktop */}
                <div className="hidden lg:flex items-center space-x-2 cursor-pointer hover:bg-green-50 p-2 rounded-lg transition-colors">
                  <MapPin size={20} className="text-green-600" />
                  <div>
                    <div className="text-xs text-gray-500">Your Location</div>
                    <div className="text-sm font-medium text-green-800">Select Location</div>
                  </div>
                  <ChevronDown size={16} className="text-green-600" />
                </div>
  
                {/* Account */}
                <div className="hidden lg:block relative">
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <User size={20} className="text-green-700" />
                        <span className="font-medium text-green-900">Account</span>
                        <ChevronDown size={16} className="text-green-600" />
                      </button>
                      
                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-green-200 rounded-lg shadow-xl z-50 animate-fadeIn">
                          <div className="p-3 border-b border-green-100">
                            <div className="font-semibold text-green-900">{user?.name}</div>
                            <div className="text-sm text-green-600">{user?.email}</div>
                          </div>
                          <div className="p-2">
                            <Link href="/profile" className="flex items-center px-3 py-2 hover:bg-green-50 rounded text-green-800">
                              <User size={16} className="mr-3" />
                              My Profile
                            </Link>
                            <Link href="/orders" className="flex items-center px-3 py-2 hover:bg-green-50 rounded text-green-800">
                              <Package size={16} className="mr-3" />
                              My Orders
                            </Link>
                            <Link href="/profile/wishlist" className="flex items-center px-3 py-2 hover:bg-green-50 rounded text-green-800">
                              <Heart size={16} className="mr-3" />
                              Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                            </Link>
                            <button 
                              onClick={handleLogout}
                              className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded mt-2"
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
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <User size={20} className="text-green-700" />
                      <span className="font-medium text-green-900">Login</span>
                    </Link>
                  )}
                </div>
  
                {/* Wishlist */}
                <Link 
                  href="/profile/wishlist" 
                  className="hidden lg:block relative p-2 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Heart size={22} className="text-green-700" />
                  {wishlistCount > 0 && (
                    <div className="cart-badge">{wishlistCount}</div>
                  )}
                </Link>
  
                {/* Cart */}
                <Link 
                  href="/cart" 
                  className="relative p-2 hover:bg-green-50 rounded-lg transition-colors flex items-center"
                >
                  <div className="relative">
                    <ShoppingCart size={24} className="text-green-700" />
                    {cartCount > 0 && (
                      <div className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</div>
                    )}
                  </div>
                  <div className="hidden lg:block ml-2">
                    <div className="font-medium text-green-900">Cart</div>
                    <div className="text-xs text-green-600">Ksh 0.00</div>
                  </div>
                </Link>
              </div>
            </div>
  
            {/* Mobile Search Bar */}
            <div className="lg:hidden py-3">
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border border-green-300 rounded-l-2xl focus:outline-none focus:border-orange-500"
                      style={{ borderRadius: '16px 0 0 16px' }}
                    />
                    <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center">
                      <Search className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-r-2xl hover:from-orange-700 hover:to-orange-600 transition-all duration-300 border border-orange-600"
                    style={{ borderRadius: '0 16px 16px 0' }}
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
  
            {/* Second Navigation Row - Mixed Green & Orange */}
            <div className="hidden lg:flex items-center justify-between py-3 border-t border-green-100">
              {/* Categories Button */}
              <div className="relative">
                <button
                  onClick={() => setCategoriesOpen(!categoriesOpen)}
                  className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-300 shadow-md"
                >
                  <Menu size={20} />
                  <span className="font-semibold">ALL CATEGORIES</span>
                  <ChevronDown size={16} className={`transition-transform ${categoriesOpen ? 'rotate-180' : ''}`} />
                </button>
  
                {/* Categories Dropdown */}
                {categoriesOpen && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-green-200 rounded-lg shadow-2xl z-50 animate-fadeIn">
                    <div className="p-4">
                      <h3 className="font-bold text-green-900 mb-4 text-lg">Browse Categories</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <Link
                            key={category.name}
                            href={`/categories/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                            className="flex items-center justify-between p-3 hover:bg-green-50 rounded-lg transition-colors group border border-green-100"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{category.icon}</span>
                              <div>
                                <div className="font-medium text-green-900">{category.name}</div>
                                <div className="text-xs text-green-600">{category.subcategories.length} items</div>
                              </div>
                            </div>
                            <ChevronRight size={16} className="text-green-400 group-hover:text-green-600" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Navigation Links - Mixed Colors */}
              <nav className="flex items-center space-x-6">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="nav-underline text-green-900 font-medium hover:text-orange-600 transition-colors flex items-center space-x-2"
                    >
                      <Icon size={18} className={link.name === 'Deals' ? 'text-orange-500' : 'text-green-600'} />
                      <span className={link.name === 'Deals' ? 'text-orange-600 font-bold' : ''}>
                        {link.name}
                      </span>
                      {link.name === 'Deals' && (
                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                          HOT
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
  
              {/* Contact Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                  <Headphones size={20} className="text-orange-600" />
                  <div>
                    <div className="text-xs text-gray-600">Need help? Call us</div>
                    <div className="text-sm font-semibold text-green-800">+254 716 354589</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        {/* Mobile Search Overlay */}
        {searchOpen && (
          <div className="lg:hidden fixed inset-0 bg-white z-50">
            <div className="p-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-green-900">Search Products</h2>
                <button 
                  onClick={() => setSearchOpen(false)}
                  className="p-2"
                >
                  <X size={24} className="text-orange-600" />
                </button>
              </div>
              
              <form onSubmit={handleSearch} className="relative mb-6">
                <div className="flex items-center">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="What are you looking for?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 border border-green-300 rounded-2xl focus:outline-none focus:border-orange-500"
                      autoFocus
                      style={{ borderRadius: '16px' }}
                    />
                    <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center">
                      <Search className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="ml-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-2xl hover:from-orange-700 hover:to-orange-600 transition-all duration-300 border border-orange-600"
                    style={{ borderRadius: '16px' }}
                  >
                    Search
                  </button>
                </div>
              </form>
              
              <div>
                <h3 className="font-medium mb-3 text-green-900">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {['Milk', 'Bread', 'Eggs', 'Rice', 'Sugar', 'Cooking Oil'].map((item) => (
                    <button
                      key={item}
                      onClick={() => handleQuickSearch(item)}
                      className="px-4 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-sm hover:from-green-100 hover:to-green-200 transition-all duration-300"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Mobile Menu - Opens from LEFT */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl animate-slideInLeft">
              <div className="p-6 h-full overflow-y-auto">
                {/* Menu Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-orange-500">
                      <Image
                        src="/logo.jpeg"
                        alt="Lando Hypermarket Logo"
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-green-700">LANDO</div>
                      <div className="text-xs text-orange-600">HYPERMARKET</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-green-50 rounded-lg"
                  >
                    <X size={24} className="text-orange-600" />
                  </button>
                </div>
  
                {/* User Section */}
                <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-green-900">{user?.name}</div>
                        <div className="text-sm text-green-600">{user?.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-green-700 font-medium">Welcome to Lando Hypermarket</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Link 
                          href="/auth/login" 
                          className="py-2 text-center border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link 
                          href="/auth/register" 
                          className="py-2 text-center bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-600 transition-all duration-300"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
  
                {/* Mobile Navigation */}
                <nav className="mb-8">
                  <h3 className="font-semibold mb-4 text-green-900 border-b border-green-100 pb-2">Menu</h3>
                  <div className="space-y-1">
                    {navLinks.slice(0, 3).map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link 
                          key={link.name}
                          href={link.href} 
                          className="flex items-center justify-between py-3 px-2 hover:bg-green-50 rounded-lg transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon size={20} className={link.name === 'Deals' ? 'text-orange-500' : 'text-green-600'} />
                            <span className={`font-medium ${link.name === 'Deals' ? 'text-orange-600' : 'text-green-900'}`}>
                              {link.name}
                            </span>
                          </div>
                          {link.name === 'Deals' && (
                            <span className="text-xs px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full">
                              SALE
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </nav>
  
                {/* Categories */}
                <div className="mb-8">
                  <h3 className="font-semibold mb-4 text-green-900 border-b border-green-100 pb-2">Categories</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.slice(0, 4).map((category) => (
                      <Link
                        key={category.name}
                        href={`/categories/${category.name.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                        className="p-3 border border-green-200 rounded-lg hover:border-green-600 transition-colors bg-green-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{category.icon}</span>
                          <span className="text-sm font-medium text-green-900">{category.name}</span>
                        </div>
                        <div className="text-xs text-green-600">{category.subcategories.length} items</div>
                      </Link>
                    ))}
                  </div>
                  <Link 
                    href="/categories" 
                    className="mt-4 block text-center py-3 border border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    View All Categories
                  </Link>
                </div>
  
                {/* Account Links */}
                {isAuthenticated && (
                  <div className="border-t border-green-100 pt-6">
                    <h3 className="font-semibold mb-4 text-green-900">My Account</h3>
                    <div className="space-y-1">
                      <Link 
                        href="/profile" 
                        className="flex items-center py-2 px-2 hover:bg-green-50 rounded text-green-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User size={18} className="mr-3" />
                        Profile
                      </Link>
                      <Link 
                        href="/orders" 
                        className="flex items-center py-2 px-2 hover:bg-green-50 rounded text-green-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Package size={18} className="mr-3" />
                        Orders
                      </Link>
                      <Link 
                        href="/profile/wishlist" 
                        className="flex items-center py-2 px-2 hover:bg-green-50 rounded text-green-800"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Heart size={18} className="mr-3" />
                        Wishlist {wishlistCount > 0 && `(${wishlistCount})`}
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full py-2 px-2 text-red-600 hover:bg-red-50 rounded font-medium mt-4"
                      >
                        <LogIn size={18} className="mr-3 rotate-180" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };
  
  export default Header;