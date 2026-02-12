'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShoppingBag, User, Search, Menu, X,
  ChevronDown, Phone, MapPin, LogIn, UserPlus,
  Home, Package, Heart, ShoppingCart, Star,
  Clock, Tag, ChevronRight, Menu as MenuIcon,
  Home as HomeIcon, Package as PackageIcon,
  Percent as PercentIcon, User as UserIcon,
  ShoppingBasket, Truck, Sparkles, Leaf
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  image_url?: string;
  parent_id: number | null;
  order: string;
  is_active: boolean;
  active_products_count: string;
  children: Category[];
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string | number;
  main_image?: string;
  thumbnail?: string;
  rating?: number;
}

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  // Refs
  const categoryRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Format price helper function
  const formatPrice = (price: string | number): string => {
    if (typeof price === 'string') {
      const num = parseFloat(price);
      return isNaN(num) ? '0.00' : num.toFixed(2);
    }
    if (typeof price === 'number') {
      return price.toFixed(2);
    }
    return '0.00';
  };

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const response = await api.cart.getCount();
      const count = response.data?.count || response.data || 0;
      setCartCount(Number(count));
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, isAuthenticated]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        const data = response.data || [];
        const parentCategories = data.filter((category: Category) => 
          category.parent_id === null && 
          category.is_active && 
          parseInt(category.active_products_count) > 0
        );
        
        const sortedCategories = parentCategories.sort((a: Category, b: Category) => {
          const aCount = parseInt(a.active_products_count);
          const bCount = parseInt(b.active_products_count);
          return bCount - aCount;
        });
        
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch category products
  const fetchCategoryProducts = async (categoryId: number) => {
    try {
      const response = await api.products.getAll({
        category_id: categoryId,
        per_page: 12
      });
      
      const data = response.data;
      const products = data?.data || data || [];
      const formattedProducts = products.map((product: any) => ({
        ...product,
        price: product.price || 0
      }));
      setCategoryProducts(formattedProducts);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProducts([]);
    }
  };

  // Handle category hover
  const handleCategoryHover = (category: Category) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(category);
      fetchCategoryProducts(category.id);
    }, 150);
  };

  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setCategoryProducts([]);
    }, 200);
  };

  // Handle search
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.products.search(searchQuery);
        const data = response.data;
        const products = data?.data || data || [];
        const formattedProducts = products.map((product: any) => ({
          ...product,
          price: product.price || 0
        }));
        setSearchResults(formattedProducts.slice(0, 6));
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching products:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(target)) {
        setActiveCategory(null);
        setCategoryProducts([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle body overflow for mobile menu
  useEffect(() => {
    if (mobileMenuOpen || mobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen, mobileSearchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const getUserInitials = () => {
    if (!user) return 'U';
    const nameParts = user.name?.split(' ') || [];
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return user.name ? user.name[0].toUpperCase() : 'U';
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setCartCount(0);
  };

  // Navigation items for mobile bottom nav
  const mobileNavItems = [
    { path: '/', label: 'Home', icon: <HomeIcon size={22} /> },
    { path: '/products', label: 'Shop', icon: <PackageIcon size={22} /> },
    { path: '/deals', label: 'Deals', icon: <PercentIcon size={22} /> },
    { path: '/cart', label: 'Cart', icon: <ShoppingCart size={22} /> },
    { path: '/profile', label: 'Profile', icon: <UserIcon size={22} /> },
  ];

  // Desktop navigation items
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/products', label: 'Shop All' },
    { path: '/categories/handicrafts-1', label: 'Handicrafts' },
    { path: '/deals', label: 'Hot Deals' },
    { path: '/categories/vegetables', label: 'Vegetables' },
    { path: '/categories/wooden-utensils', label: 'Wooden Utensils' },
  ];

  return (
    <>
      {/* Top Announcement Bar - Warm Gradient */}
      <div className="bg-gradient-to-r from-orange-500 to-emerald-600 text-white py-2">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Truck size={14} className="text-orange-200" />
                <span className="text-white font-medium">Free delivery for all orders</span>
              </div>
              <span className="hidden md:inline text-white/70">•</span>
              <span className="hidden md:inline text-white/90">Open 24/7</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-orange-200" />
                <span className="text-white/90">+254 716 354 589</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-orange-200" />
                <span className="text-white/90">Store Locator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md bg-white/95 backdrop-blur-sm' : 'bg-white'}`}>
        {/* Middle Header */}
        <header className="py-3 border-b border-orange-100" ref={containerRef}>
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 hover:text-orange-600 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MenuIcon size={24} className="text-orange-600" />
              </button>

              {/* Logo - Mixed warm orange and emerald */}
              <Link href="/" className="flex items-center space-x-3 no-underline group">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-emerald-600 flex items-center justify-center group-hover:from-orange-600 group-hover:to-emerald-700 transition-all duration-300 shadow-md">
                  <ShoppingBasket size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-orange-600 group-hover:text-orange-700 transition-colors">Lando</span>
                    <span className="text-emerald-600 group-hover:text-emerald-700 transition-colors ml-1">Hypermarket</span>
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1 group-hover:text-orange-500 transition-colors">One-stop online & Shopping</p>
                </div>
              </Link>

              {/* Search Bar - Desktop */}
              <div className="hidden lg:block flex-1 max-w-3xl mx-4 md:mx-6 lg:mx-8" ref={searchRef}>
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search for products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-800 placeholder-orange-300"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-orange-400" />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-orange-500 hover:to-orange-600 text-white px-4 py-1.5 rounded transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      Search
                    </button>
                  </div>
                  
                  {/* Search Results */}
                  {showSearchResults && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-orange-200 z-50">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          <div className="p-3 border-b bg-gradient-to-r from-orange-50 to-emerald-50">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-orange-700">Search Results</h3>
                              <button
                                onClick={handleSearch}
                                className="text-sm text-emerald-600 hover:text-orange-600 transition-colors"
                              >
                                See all
                              </button>
                            </div>
                          </div>
                          <div className="max-h-80 overflow-y-auto">
                            {searchResults.map((product) => (
                              <Link
                                key={product.id}
                                href={`/products/${product.slug}`}
                                className="flex items-center p-3 hover:bg-orange-50 border-b border-orange-100 transition-colors group"
                                onClick={() => setShowSearchResults(false)}
                              >
                                <div className="w-10 h-10 rounded bg-gradient-to-br from-orange-100 to-emerald-100 mr-3 flex-shrink-0">
                                  <Image
                                    src={api.getImageUrl(product.main_image || product.thumbnail, '/placeholder-product.jpg')}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600">{product.name}</p>
                                  <div className="flex items-center mt-1">
                                    <p className="text-emerald-700 font-bold text-sm group-hover:text-orange-600">Ksh {formatPrice(product.price)}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-orange-600">No products found</p>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* User Account */}
                <div className="hidden md:block relative" ref={userMenuRef}>
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center space-x-2 p-2 hover:text-orange-600 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold group-hover:from-orange-600 group-hover:to-emerald-700 transition-all duration-300 shadow-sm">
                          {getUserInitials()}
                        </div>
                        <span className="text-sm font-medium hidden lg:inline text-gray-700 group-hover:text-orange-600 transition-colors duration-300">Account</span>
                        <ChevronDown size={14} className="text-gray-500 group-hover:text-orange-500 transition-colors duration-300" />
                      </button>
                      
                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-orange-200 min-w-[200px] z-50">
                          <div className="p-3 border-b bg-gradient-to-r from-orange-50 to-emerald-50">
                            <p className="font-semibold text-gray-800">{user?.name}</p>
                            <p className="text-sm text-emerald-600 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/profile"
                              className="block px-4 py-2 text-sm hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              My Profile
                            </Link>
                            <Link
                              href="/orders"
                              className="block px-4 py-2 text-sm hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              My Orders
                            </Link>
                            <button
                              onClick={handleLogout}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
                            >
                              Logout
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Link
                        href="/login"
                        className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-emerald-600 transition-colors hover:underline"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-orange-500 hover:to-orange-600 text-white text-sm font-medium rounded transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        Join Free
                      </Link>
                    </div>
                  )}
                </div>

                {/* Cart */}
                <Link 
                  href="/cart" 
                  className="relative p-2 hover:text-orange-600 transition-colors group"
                >
                  <div className="relative">
                    <ShoppingCart size={24} className="text-orange-500 group-hover:text-emerald-600 transition-colors duration-300" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  {/* Cart Preview on Hover */}
                  <div className="hidden lg:block absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg p-3 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40 border border-orange-200">
                    <div className="font-bold text-orange-700 mb-2">Your Cart</div>
                    <div className="text-sm text-emerald-600">
                      {cartCount > 0 
                        ? `${cartCount} item${cartCount > 1 ? 's' : ''} in cart` 
                        : 'Your cart is empty'}
                    </div>
                    {cartCount > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-bold text-orange-600 mb-1">Subtotal: Ksh 0.00</div>
                        <Link
                          href="/cart"
                          className="block w-full text-center py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-orange-500 hover:to-orange-600 text-white rounded-lg transition-all duration-300 mt-2 shadow-sm hover:shadow-md"
                        >
                          View Cart
                        </Link>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Categories Navigation - Desktop */}
        <nav className="hidden lg:block border-b border-orange-100 bg-white relative">
          <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex items-center">
              {/* All Categories Dropdown */}
              <div className="relative" ref={categoryRef}>
                <button
                  onMouseEnter={() => {
                    if (categories.length > 0) {
                      setActiveCategory(categories[0]);
                      fetchCategoryProducts(categories[0].id);
                    }
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-orange-500 hover:to-orange-600 text-white font-medium transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Menu size={18} />
                  <span>Browse Categories</span>
                  <ChevronDown size={16} />
                </button>
                
                {/* Mega Menu */}
                {activeCategory && (
                  <div 
                    className="absolute top-full left-0 bg-white shadow-xl border border-orange-200 z-50 overflow-hidden rounded-b-lg"
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                    }}
                    onMouseLeave={handleCategoryLeave}
                    style={{
                      width: 'min(1400px, calc(100vw - 2rem))',
                      maxWidth: '1400px',
                      left: '0',
                      right: '0',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                    <div className="flex">
                      {/* Categories Column */}
                      <div className="w-72 bg-gradient-to-b from-white to-orange-50/30 border-r border-orange-200">
                        <div className="p-4 border-b border-orange-200 bg-gradient-to-r from-orange-50 to-emerald-50">
                          <h3 className="font-bold text-orange-700">Categories</h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onMouseEnter={() => handleCategoryHover(category)}
                              className={`w-full text-left px-4 py-3 border-b border-orange-100 flex items-center justify-between transition-all duration-200 ${
                                activeCategory?.id === category.id 
                                  ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 font-medium border-orange-300' 
                                  : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                              }`}
                            >
                              <span className="font-medium">{category.name}</span>
                              <ChevronRight size={14} className="text-orange-400" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Products Column */}
                      <div className="flex-1 p-6">
                        <div className="mb-6">
                          <h2 className="text-2xl font-bold">
                            <span className="text-orange-600">{activeCategory.name}</span>
                          </h2>
                          <p className="text-emerald-600 mt-1">Explore our premium collection</p>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-4 max-h-[360px] overflow-y-auto pr-2">
                          {categoryProducts.slice(0, 16).map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              className="group"
                              onClick={() => setActiveCategory(null)}
                            >
                              <div className="flex flex-col p-3 hover:bg-gradient-to-br hover:from-orange-50 hover:to-emerald-50 rounded-lg border border-transparent hover:border-orange-300 transition-all duration-300">
                                <div className="w-full h-32 rounded-lg bg-gradient-to-br from-orange-100 to-emerald-100 mb-3 overflow-hidden">
                                  <Image
                                    src={api.getImageUrl(product.main_image || product.thumbnail, '/placeholder-product.jpg')}
                                    alt={product.name}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800 text-sm line-clamp-2 group-hover:text-orange-600">
                                    {product.name}
                                  </h4>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-emerald-700 group-hover:text-orange-600">
                                      Ksh {formatPrice(product.price)}
                                    </span>
                                    {product.rating && (
                                      <div className="flex items-center">
                                        <Star size={12} className="text-orange-400 fill-current" />
                                        <span className="text-xs text-emerald-600 ml-1">{product.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <button className="w-full mt-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-orange-500 hover:to-orange-600 text-white text-xs font-medium rounded transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-sm hover:shadow-md">
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        
                        {categoryProducts.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-orange-200">
                            <Link
                              href={`/category/${activeCategory.slug}`}
                              className="inline-flex items-center text-emerald-600 hover:text-orange-600 font-semibold transition-colors duration-300"
                              onClick={() => setActiveCategory(null)}
                            >
                              View all products in {activeCategory.name}
                              <ChevronRight size={18} className="ml-2" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-2 ml-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-orange-600 border-b-2 border-orange-500'
                        : 'text-gray-600 hover:text-orange-600 hover:border-b-2 hover:border-orange-400'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Hot Deals Badge */}
              <div className="ml-auto">
                <Link
                  href="/deals"
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <Tag size={16} className="text-white" />
                  <span className="font-bold">HOT DEALS</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Search Bar */}
        <div className="lg:hidden border-b border-orange-100">
          <div className="px-4 py-3">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-11 bg-orange-50/50 rounded-lg border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-800 placeholder-orange-400"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Side Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div 
            ref={mobileMenuRef}
            className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 bg-gradient-to-br from-orange-500 to-emerald-600 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <ShoppingBasket size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg text-white">Lando Hypermarket</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* User Info */}
                {isAuthenticated && user ? (
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-orange-600 font-bold mr-3">
                        {getUserInitials()}
                      </div>
                      <div>
                        <p className="font-bold text-white">{user.name}</p>
                        <p className="text-sm text-white/80">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Link 
                      href="/login" 
                      className="flex-1 py-2 bg-white/20 hover:bg-white/30 text-white rounded text-center font-medium transition-colors duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="flex-1 py-2 bg-white hover:bg-orange-100 text-orange-600 rounded text-center font-medium transition-colors duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Join Free
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto">
                {/* Categories */}
                <div className="p-4">
                  <h3 className="font-semibold text-orange-700 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="flex items-center justify-between py-2.5 px-3 rounded hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="font-medium">{category.name}</span>
                        <ChevronRight size={14} className="text-orange-400" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="p-4 border-t border-orange-100">
                  <h3 className="font-semibold text-emerald-700 mb-3">Quick Links</h3>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center py-2.5 px-3 rounded hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link
                      href="/wishlist"
                      className="flex items-center py-2.5 px-3 rounded hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart size={18} className="mr-3 text-pink-500" />
                      My Wishlist
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center py-2.5 px-3 rounded hover:bg-orange-50 text-gray-700 hover:text-orange-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package size={18} className="mr-3 text-emerald-600" />
                      My Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-200 z-40 shadow-lg">
        <div className="flex items-center justify-around py-3 px-4">
          {mobileNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center p-2 flex-1 transition-colors ${
                isActive(item.path)
                  ? 'text-orange-600'
                  : 'text-emerald-600'
              }`}
            >
              <div className={`p-2 rounded-full mb-1 transition-colors ${
                isActive(item.path) ? 'bg-orange-50' : ''
              }`}>
                {React.cloneElement(item.icon, {
                  className: isActive(item.path) ? 'text-orange-600' : 'text-emerald-600'
                })}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Add padding to main content for bottom nav */}
      <div className="lg:hidden pb-16" />
    </>
  );
};

export default Header;