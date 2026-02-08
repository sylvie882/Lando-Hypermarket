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

  // Color scheme
  const colors = {
    // Primary: Light green for text
    text: {
      lightGreen: '#90EE90',      // Light green for text
      lightGreenDark: '#7CD67C',  // Slightly darker for some text
    },
    // Special elements: Warm orange
    accent: {
      warmOrange: '#FF8C42',      // Logo, cart, browse categories
      warmOrangeDark: '#E67E35',  // Darker orange for hover
    },
    // Top bar: Dark green
    topBar: {
      darkGreen: '#006400',       // Dark green for top bar
      darkGreenLight: '#228B22',  // Lighter dark green
    },
    // Hover states: Warm orange
    hover: {
      warmOrange: '#FF8C42',
      warmOrangeLight: '#FFE8D9',
    },
    // Neutral colors
    neutral: {
      white: '#FFFFFF',
      gray50: '#FAFAFA',
      gray100: '#F5F5F5',
      gray200: '#EEEEEE',
      gray600: '#757575',
      gray800: '#424242',
      black: '#212121',
    }
  };

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
    { path: '/fresh', label: 'Fresh' },
    { path: '/deals', label: 'Hot Deals' },
    { path: '/organic', label: 'Organic' },
    { path: '/beverages', label: 'Beverages' },
  ];

  return (
    <>
      {/* Top Announcement Bar - Dark Green */}
      <div className="bg-green-900 text-white py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Truck size={14} className="text-lime-300" />
                <span>Free delivery for all orders</span>
              </div>
              <span className="hidden md:inline">•</span>
              <span className="hidden md:inline">Open 24/7</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-lime-300" />
                <span>+254 716 354 589</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={14} className="text-lime-300" />
                <span>Store Locator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md bg-white' : 'bg-white'}`}>
        {/* Middle Header */}
        <header className="py-3 border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between gap-4">
              {/* Mobile Menu Button - Light green text */}
              <button
                className="lg:hidden p-2 hover:text-orange-500 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MenuIcon size={24} className="text-lime-500" />
              </button>

              {/* Logo - Warm orange */}
              <Link href="/" className="flex items-center space-x-3 no-underline group">
                <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                  <ShoppingBasket size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-orange-500">Lando</h1>
                  <p className="text-xs text-lime-600 -mt-1 group-hover:text-orange-500 transition-colors">Hypermarket</p>
                </div>
              </Link>

              {/* Search Bar - Desktop */}
              <div className="hidden lg:block flex-1 max-w-2xl mx-8" ref={searchRef}>
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search for products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-lime-700 placeholder-lime-500"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-lime-500" />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-lime-500 text-white px-4 py-1.5 rounded hover:bg-orange-500 transition-colors"
                    >
                      Search
                    </button>
                  </div>
                  
                  {/* Search Results */}
                  {showSearchResults && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                      {isSearching ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lime-500 mx-auto"></div>
                        </div>
                      ) : searchResults.length > 0 ? (
                        <>
                          <div className="p-3 border-b bg-lime-50">
                            <div className="flex justify-between items-center">
                              <h3 className="font-semibold text-lime-800">Search Results</h3>
                              <button
                                onClick={handleSearch}
                                className="text-sm text-lime-600 hover:text-orange-500 transition-colors"
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
                                className="flex items-center p-3 hover:bg-orange-50 border-b border-gray-100 transition-colors group"
                                onClick={() => setShowSearchResults(false)}
                              >
                                <div className="w-10 h-10 rounded bg-gray-100 mr-3 flex-shrink-0">
                                  <Image
                                    src={api.getImageUrl(product.main_image || product.thumbnail, '/placeholder-product.jpg')}
                                    alt={product.name}
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover rounded"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-500">{product.name}</p>
                                  <div className="flex items-center mt-1">
                                    <p className="text-lime-600 font-bold text-sm group-hover:text-orange-500">Ksh {formatPrice(product.price)}</p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-lime-600">No products found</p>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>

              {/* Right Side Actions */}
              <div className="flex items-center space-x-4">
                {/* User Account - Light green text */}
                <div className="hidden md:block relative" ref={userMenuRef}>
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center space-x-2 p-2 hover:text-orange-500 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white text-sm font-bold">
                          {getUserInitials()}
                        </div>
                        <span className="text-sm font-medium hidden lg:inline text-lime-600 hover:text-orange-500 transition-colors">Account</span>
                        <ChevronDown size={14} className="text-lime-500" />
                      </button>
                      
                      {userMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px] z-50">
                          <div className="p-3 border-b">
                            <p className="font-semibold text-lime-800">{user?.name}</p>
                            <p className="text-sm text-lime-600 truncate">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/profile"
                              className="block px-4 py-2 text-sm hover:bg-orange-50 text-lime-700 hover:text-orange-500 transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              My Profile
                            </Link>
                            <Link
                              href="/orders"
                              className="block px-4 py-2 text-sm hover:bg-orange-50 text-lime-700 hover:text-orange-500 transition-colors"
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
                        className="px-4 py-2 text-sm font-medium text-lime-600 hover:text-orange-500 transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="px-4 py-2 bg-lime-500 text-white text-sm font-medium rounded hover:bg-orange-500 transition-colors"
                      >
                        Join Free
                      </Link>
                    </div>
                  )}
                </div>

                {/* Cart - Warm orange */}
                <Link 
                  href="/cart" 
                  className="relative p-2 hover:text-orange-500 transition-colors group"
                >
                  <div className="relative">
                    <ShoppingCart size={24} className="text-orange-500" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  {/* Cart Preview on Hover */}
                  <div className="hidden lg:block absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg p-3 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-40">
                    <div className="font-bold text-lime-800 mb-2">Your Cart</div>
                    <div className="text-sm text-lime-600">
                      {cartCount > 0 
                        ? `${cartCount} item${cartCount > 1 ? 's' : ''} in cart` 
                        : 'Your cart is empty'}
                    </div>
                    {cartCount > 0 && (
                      <div className="mt-3">
                        <div className="text-sm font-bold text-lime-800 mb-1">Subtotal: Ksh 0.00</div>
                        <Link
                          href="/cart"
                          className="block w-full text-center py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors mt-2"
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
        <nav className="hidden lg:block border-b border-gray-100 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center">
              {/* All Categories Dropdown - Warm orange button */}
              <div className="relative" ref={categoryRef}>
                <button
                  onMouseEnter={() => {
                    if (categories.length > 0) {
                      setActiveCategory(categories[0]);
                      fetchCategoryProducts(categories[0].id);
                    }
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                >
                  <Menu size={18} />
                  <span>Browse Categories</span>
                  <ChevronDown size={16} />
                </button>
                
                {/* Mega Menu - Wide Layout */}
                {activeCategory && (
                  <div 
                    className="absolute left-0 top-full bg-white shadow-xl border border-gray-200 z-50"
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                    }}
                    onMouseLeave={handleCategoryLeave}
                    style={{ minWidth: '900px', maxWidth: 'calc(100vw - 2rem)' }}
                  >
                    <div className="flex p-6">
                      {/* Categories Column */}
                      <div className="w-64 bg-lime-50 border-r border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                          <h3 className="font-bold text-lime-800">Categories</h3>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onMouseEnter={() => handleCategoryHover(category)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center justify-between transition-colors ${
                                activeCategory?.id === category.id 
                                  ? 'bg-orange-50 text-orange-500 font-medium' 
                                  : 'text-lime-700 hover:bg-orange-50 hover:text-orange-500'
                              }`}
                            >
                              <span>{category.name}</span>
                              <ChevronRight size={14} className="text-lime-400" />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Products Column */}
                      <div className="flex-1 pl-6">
                        <div className="mb-6">
                          <h2 className="text-2xl font-bold text-lime-800">{activeCategory.name}</h2>
                          <p className="text-lime-600 mt-1">Explore our collection</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-4">
                          {categoryProducts.slice(0, 15).map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              className="group"
                              onClick={() => setActiveCategory(null)}
                            >
                              <div className="flex flex-col p-3 hover:bg-orange-50 rounded-lg border border-transparent hover:border-orange-200 transition-colors">
                                <div className="w-full h-32 rounded-lg bg-gray-100 mb-3 overflow-hidden">
                                  <Image
                                    src={api.getImageUrl(product.main_image || product.thumbnail, '/placeholder-product.jpg')}
                                    alt={product.name}
                                    width={128}
                                    height={128}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-lime-800 text-sm line-clamp-2 group-hover:text-orange-500">
                                    {product.name}
                                  </h4>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="font-bold text-lime-600 group-hover:text-orange-500">
                                      Ksh {formatPrice(product.price)}
                                    </span>
                                    {product.rating && (
                                      <div className="flex items-center">
                                        <Star size={12} className="text-orange-400 fill-current" />
                                        <span className="text-xs text-lime-600 ml-1">{product.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                  <button className="w-full mt-3 py-1.5 bg-lime-500 text-white text-xs font-medium rounded hover:bg-orange-500 transition-colors opacity-0 group-hover:opacity-100">
                                    Add to Cart
                                  </button>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        
                        {categoryProducts.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <Link
                              href={`/category/${activeCategory.slug}`}
                              className="inline-flex items-center text-lime-600 hover:text-orange-500 font-semibold transition-colors"
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

              {/* Navigation Links - Light green text, orange hover */}
              <div className="flex items-center space-x-1 ml-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'text-orange-500 border-b-2 border-orange-500'
                        : 'text-lime-600 hover:text-orange-500'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* Hot Deals Badge - Light green with orange hover */}
              <div className="ml-auto">
                <Link
                  href="/deals"
                  className="flex items-center space-x-2 px-4 py-2 bg-lime-500 text-white rounded-lg hover:bg-orange-500 transition-colors"
                >
                  <Tag size={16} />
                  <span className="font-bold">HOT DEALS</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Search Bar - Light green theme */}
        <div className="lg:hidden border-b border-gray-100">
          <form onSubmit={handleSearch} className="p-3">
            <div className="relative">
              <input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-lime-400 text-lime-700"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-lime-500" />
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Side Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div 
            ref={mobileMenuRef}
            className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl"
          >
            <div className="h-full flex flex-col">
              {/* Header - Light green theme */}
              <div className="p-4 bg-lime-500 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                      <ShoppingBasket size={20} />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">Lando Hypermarket</h2>
                    </div>
                  </div>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/20 rounded-lg"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                {/* User Info */}
                {isAuthenticated && user ? (
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-lime-600 font-bold mr-3">
                        {getUserInitials()}
                      </div>
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-sm opacity-90">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Link 
                      href="/login" 
                      className="flex-1 py-2 bg-white text-lime-600 rounded text-center font-medium hover:bg-orange-50 hover:text-orange-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/register" 
                      className="flex-1 py-2 bg-white/20 rounded text-center font-medium hover:bg-white/30 transition-colors"
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
                  <h3 className="font-semibold text-lime-800 mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="flex items-center justify-between py-2.5 px-3 rounded hover:bg-orange-50 text-lime-700 hover:text-orange-500 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{category.name}</span>
                        <span className="text-xs bg-lime-100 text-lime-600 px-2 py-1 rounded">
                          {category.active_products_count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="p-4 border-t">
                  <h3 className="font-semibold text-lime-800 mb-3">Quick Links</h3>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center py-2.5 px-3 rounded hover:bg-orange-50 text-lime-700 hover:text-orange-500 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    <Link
                      href="/wishlist"
                      className="flex items-center py-2.5 px-3 rounded hover:bg-orange-50 text-lime-700 hover:text-orange-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Heart size={18} className="mr-3" />
                      My Wishlist
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center py-2.5 px-3 rounded hover:bg-orange-50 text-lime-700 hover:text-orange-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Package size={18} className="mr-3" />
                      My Orders
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation - Light green with orange active/hover */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 shadow-lg">
        <div className="flex items-center justify-around py-3 px-2">
          {mobileNavItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center p-2 flex-1 transition-colors ${
                isActive(item.path)
                  ? 'text-orange-500'
                  : 'text-lime-600'
              }`}
            >
              <div className={`p-2 rounded-full mb-1 ${
                isActive(item.path) ? 'bg-orange-50' : ''
              }`}>
                {React.cloneElement(item.icon, {
                  className: isActive(item.path) ? 'text-orange-500' : 'text-lime-500'
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