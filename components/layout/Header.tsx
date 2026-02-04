'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShoppingBag, User, Search, Menu, X, Gift,
  ChevronDown, Phone, Globe, LogIn, UserPlus,
  Smartphone, Home, Info, Briefcase, Package, Mail,
  ChevronRight, ShoppingCart, Heart, LogOut, Settings, Shield
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
  price: number;
  main_image?: string;
  thumbnail?: string;
  rating?: number;
}

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyMenuOpen, setCurrencyMenuOpen] = useState(false);
  const [productsMenuOpen, setProductsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  // Refs
  const currencyRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Function to fetch cart count
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

  // Custom hook for real-time cart updates
  const useCartRealtime = () => {
    const { isAuthenticated } = useAuth();
    
    // Function to manually refresh cart count
    const refreshCartCount = useCallback(async () => {
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }
      
      try {
        const response = await api.cart.getCount();
        const count = response.data?.count || response.data || 0;
        setCartCount(Number(count));
        
        // Also update localStorage for cross-tab synchronization
        localStorage.setItem('cart_last_updated', Date.now().toString());
        localStorage.setItem('cart_count', count.toString());
      } catch (error) {
        console.error('Error fetching cart count:', error);
        setCartCount(0);
      }
    }, [isAuthenticated]);

    // Listen for cart events from other components
    useEffect(() => {
      const handleCartUpdate = () => {
        refreshCartCount();
      };

      // Listen for custom events
      window.addEventListener('cart:updated', handleCartUpdate);
      window.addEventListener('cart:itemAdded', handleCartUpdate);
      window.addEventListener('cart:itemRemoved', handleCartUpdate);
      window.addEventListener('cart:cleared', handleCartUpdate);
      
      // Listen for storage events (if cart is updated in another tab)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'cart_updated' || e.key === 'cart_count') {
          refreshCartCount();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      
      // Listen for page visibility changes (when user returns to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          refreshCartCount();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('cart:updated', handleCartUpdate);
        window.removeEventListener('cart:itemAdded', handleCartUpdate);
        window.removeEventListener('cart:itemRemoved', handleCartUpdate);
        window.removeEventListener('cart:cleared', handleCartUpdate);
        window.removeEventListener('storage', handleStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [refreshCartCount]);

    // Manual refresh function
    return { refreshCartCount };
  };

  // Initialize real-time cart tracking
  const { refreshCartCount } = useCartRealtime();

  // Fetch cart count on component mount and when auth status changes
  useEffect(() => {
    fetchCartCount();
    
    // Refresh cart count periodically (less frequent since we have real-time updates)
    const interval = setInterval(fetchCartCount, 60000); // Refresh every 60 seconds
    
    return () => clearInterval(interval);
  }, [fetchCartCount, isAuthenticated]);

  // Function to dispatch cart update events (can be called from other components)
  const dispatchCartUpdate = useCallback(() => {
    // Dispatch custom event
    window.dispatchEvent(new Event('cart:updated'));
    
    // Update localStorage for cross-tab synchronization
    localStorage.setItem('cart_updated', Date.now().toString());
    localStorage.removeItem('cart_updated'); // Trigger storage event
  }, []);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await api.categories.getAll();
        
        const data = response.data || [];
        
        // Filter to get only parent categories (parent_id === null)
        const parentCategories = data.filter((category: Category) => 
          category.parent_id === null && 
          category.is_active && 
          parseInt(category.active_products_count) > 0
        );
        
        // Sort by active_products_count (highest first) or by order
        const sortedCategories = parentCategories.sort((a: Category, b: Category) => {
          const aCount = parseInt(a.active_products_count);
          const bCount = parseInt(b.active_products_count);
          return bCount - aCount;
        });
        
        setCategories(sortedCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products for a category
  const fetchCategoryProducts = async (categoryId: number) => {
    try {
      setIsLoadingProducts(true);
      const response = await api.products.getAll({
        category_id: categoryId,
        per_page: 8
      });
      
      const data = response.data;
      const products = data?.data || data || [];
      setCategoryProducts(products);
    } catch (error) {
      console.error('Error fetching category products:', error);
      setCategoryProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Handle category hover with delay
  const handleCategoryHover = (category: Category) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(category);
      fetchCategoryProducts(category.id);
    }, 200);
  };

  // Handle category leave with delay
  const handleCategoryLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setCategoryProducts([]);
    }, 300);
  };

  // Handle dropdown mouse enter
  const handleDropdownMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
  };

  // Handle dropdown mouse leave
  const handleDropdownMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setCategoryProducts([]);
    }, 300);
  };

  // Handle search input change with debounce
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
        setSearchResults(products.slice(0, 5));
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

  // Close user menu and search results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyMenuOpen(false);
      }
      if (productsRef.current && !productsRef.current.contains(event.target as Node)) {
        setProductsMenuOpen(false);
      }
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target as Node) && 
          mobileMenuOpen && 
          (event.target as HTMLElement).closest('button')?.getAttribute('aria-label') !== 'Toggle navigation') {
        setMobileMenuOpen(false);
      }
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target as Node)) {
        setShowAllCategories(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
        setCategoryProducts([]);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setCurrencyMenuOpen(false);
    setProductsMenuOpen(false);
    setShowAllCategories(false);
    setActiveCategory(null);
    setCategoryProducts([]);
    setMobileSearchOpen(false);
    setUserMenuOpen(false);
    setShowSearchResults(false);
  }, [pathname]);

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

  // Focus mobile search input when opened
  useEffect(() => {
    if (mobileSearchOpen && mobileSearchRef.current) {
      mobileSearchRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  // Handle direct search submission
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSearchResults(false);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Default icon for when no image is present
  const DefaultLogo = () => (
    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
      <span className="text-white font-bold text-sm">LR</span>
    </div>
  );

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setCartCount(0);
    
    // Clear cart related localStorage
    localStorage.removeItem('cart_last_updated');
    localStorage.removeItem('cart_count');
  };

  // Update navItems to match your new navigation links
  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} className="text-green-600" /> },
    { path: '/products', label: 'Shop', icon: <Package size={20} className="text-green-600" /> },
    { path: '/deals', label: 'Hot Deals', icon: <Briefcase size={20} className="text-red-500" /> },
    { path: '/contact', label: 'Contact', icon: <Mail size={20} className="text-green-600" /> },
  ];

  // Mobile menu categories items
  const mobileMenuCategories = [
    { icon: <Package size={20} />, label: 'All Products', href: '/products' },
    { icon: <Heart size={20} />, label: 'Wishlist', href: '/wishlist' },
    { icon: <Briefcase size={20} />, label: 'Orders', href: '/orders' },
    { icon: <User size={20} />, label: 'Profile', href: '/profile' },
  ];

  // Get image URL for product
  const getProductImageUrl = (product: Product) => {
    return api.getImageUrl(product.main_image || product.thumbnail, '/placeholder-product.jpg');
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    const nameParts = user.name?.split(' ') || [];
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return user.name ? user.name[0].toUpperCase() : 'U';
  };

  // Get user role label
  const getUserRoleLabel = () => {
    if (!user) return '';
    switch (user.role) {
      case 'admin': return 'Admin';
      case 'delivery_staff': return 'Delivery Staff';
      case 'customer': return 'Customer';
      default: return 'User';
    }
  };

  // Function to handle adding to cart and update count in real-time
  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    try {
      await api.cart.addItem({ product_id: productId, quantity });
      // Refresh cart count immediately
      await fetchCartCount();
      // Dispatch event for other components
      window.dispatchEvent(new Event('cart:itemAdded'));
      
      // Show success message or notification
      // You can implement a toast notification here
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  return (
    <>
      {/* Top Header - Hide on mobile when user is logged in */}
      {(!isAuthenticated || window.innerWidth >= 768) && (
        <header className="bg-white py-2.5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              {/* Gift Certificates and Currency Dropdown */}
              <div className="mb-3 md:mb-0">
                <div className="flex items-center">
                  <div className="mr-3">
                    <a href="#" className="text-gray-800 hover:text-gray-600 flex items-center no-underline">
                      <Gift size={16} className="mr-1.5" />
                      <span className="text-sm">Free delivery for all orders</span>
                    </a>
                  </div>
                  <div className="hidden md:block border-l border-gray-400 h-6 mx-3"></div>
                  <div className="block md:hidden border-t border-gray-400 w-5 mx-2"></div>
                  <div className="relative" ref={currencyRef}>
                    <button
                      className="bg-white px-3 py-1.5 rounded border border-gray-300 text-gray-800 hover:bg-gray-50 flex items-center text-sm"
                      onClick={() => setCurrencyMenuOpen(!currencyMenuOpen)}
                    >
                      <Globe size={16} className="mr-1.5" />
                      Select Currency: Kshs
                      <ChevronDown size={14} className="ml-1.5" />
                    </button>
                    {currencyMenuOpen && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[180px]">
                        <a 
                          className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                          href="#"
                          onClick={() => setCurrencyMenuOpen(false)}
                        >
                          Default Currency
                        </a>
                        <a 
                          className="block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100"
                          href="#"
                          onClick={() => setCurrencyMenuOpen(false)}
                        >
                          Shillings
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Login/Sign Up OR User Info */}
              <div>
                {isAuthenticated ? (
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center text-gray-800 hover:text-gray-600 no-underline"
                    >
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm mr-2">
                        {getUserInitials()}
                      </div>
                      <div className="text-left hidden md:block">
                        <div className="text-sm font-medium">{user?.name}</div>
                        <div className="text-xs text-gray-500">{getUserRoleLabel()}</div>
                      </div>
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                    
                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[200px]">
                        <div className="p-3 border-b border-gray-100 bg-gray-50">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm mr-3">
                              {getUserInitials()}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user?.name}</div>
                              <div className="text-xs text-gray-500">{user?.email}</div>
                              <div className="text-xs text-green-600 font-medium">{getUserRoleLabel()}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={16} className="mr-2" />
                            My Profile
                          </Link>
                          
                          <Link
                            href="/orders"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Briefcase size={16} className="mr-2" />
                            My Orders
                          </Link>
                          
                          <Link
                            href="/wishlist"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Heart size={16} className="mr-2" />
                            Wishlist
                          </Link>
                          
                          {user?.role === 'admin' && (
                            <Link
                              href="/admin"
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-green-600"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <Shield size={16} className="mr-2" />
                              Admin Dashboard
                            </Link>
                          )}
                          
                          <div className="border-t border-gray-100 my-1"></div>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700"
                          >
                            <LogOut size={16} className="mr-2" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <ul className="flex items-center justify-start md:justify-end space-x-4">
                    <li className="flex items-center">
                      <LogIn size={16} className="mr-1.5 text-gray-600" />
                      <Link href="/login" className="text-sm text-gray-800 hover:text-gray-600 no-underline">
                        Login
                      </Link>
                    </li>
                    <li className="text-gray-500 text-sm">or</li>
                    <li className="flex items-center">
                      <UserPlus size={16} className="mr-1.5 text-gray-600" />
                      <Link href="/register" className="text-sm text-gray-800 hover:text-gray-600 no-underline">
                        Sign Up
                      </Link>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Combined Middle and Bottom Headers as one sticky wrapper */}
      <div className="sticky top-0 z-40">
        {/* Middle Header */}
        <header className="bg-gray-100 py-3 border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              {/* Mobile: Logo and Hamburger */}
              <div className="md:hidden flex items-center justify-between w-full">
                <div className="flex items-center">
                  <button 
                    className="p-2 mr-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    <Menu size={24} className="text-gray-700" />
                  </button>
                  <Link href="/" className="no-underline">
                    <h1 className="text-2xl font-medium tracking-tight text-gray-900" style={{ letterSpacing: '-0.1rem' }}>
                      <strong className="align-middle italic">Lando Hypermarket</strong>
                    </h1>
                  </Link>
                </div>
                
                {/* Mobile Icons */}
                <div className="flex items-center space-x-3">
                  <button 
                    className="p-2"
                    onClick={() => setMobileSearchOpen(true)}
                    aria-label="Search"
                  >
                    <Search size={20} className="text-gray-700" />
                  </button>
                  {isAuthenticated && (
                    <button 
                      className="relative p-2"
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                    >
                      <User size={20} className="text-gray-700" />
                    </button>
                  )}
                  <Link href="/cart" className="relative p-2">
                    <ShoppingCart size={20} className="text-gray-700" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Desktop: Logo */}
              <div className="hidden md:flex items-center">
                <Link href="/" className="no-underline">
                  <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-gray-900" style={{ letterSpacing: '-0.15rem', lineHeight: '1.1' }}>
                    <strong className="align-middle italic">Lando Hypermarket</strong>
                  </h1>
                </Link>
              </div>
              
              {/* Desktop: Contact and Cart Links */}
              <div className="hidden md:block w-full md:w-auto">
                <ul className="flex flex-col md:flex-row items-center justify-center md:justify-end space-y-4 md:space-y-0 md:space-x-8">
                  <li>
                    <Link href="/contact" className="text-green-800 hover:text-green-600 no-underline flex items-center">
                      <Smartphone size={48} className="mr-3 text-bold text-green-600" />
                      <div className="text-left">
                        <p className="text-xs text-gray-500 mb-0.5">CALL US NOW</p>
                        <p className="text-sm text-gray-700">Toll Free: +254 716 354 589</p>
                      </div>
                    </Link>
                  </li>
                  <li className="relative">
                    <Link href="/cart" className="no-underline">
                      <div className="bg-red-500 rounded-full p-2.5 w-12 h-12 flex items-center justify-center relative">
                        <ShoppingCart size={28} className="text-white" />
                        <span className="absolute -top-1.5 -right-1.5 bg-white text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-gray-300">
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      </div>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search Bar */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2">
          <div className="relative">
            <form onSubmit={handleSearch} className="flex">
              <input 
                ref={mobileSearchRef}
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <button 
                type="submit"
                className="ml-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
              >
                Go
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Navigation - Desktop Only */}
        <nav className="hidden md:block bg-gray-600 py-2">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              {/* Navigation Links - Desktop */}
              <div className="hidden md:flex w-full md:w-auto">
                <ul className="flex flex-col md:flex-row md:items-center md:space-x-8 space-y-4 md:space-y-0">
                  <li>
                    <Link 
                      className={`text-white font-medium hover:text-gray-200 no-underline py-1 md:py-0 block ${isActive('/') ? 'font-bold' : ''}`}
                      href="/"
                    >
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className={`text-white font-medium hover:text-gray-200 no-underline py-1 md:py-0 block ${isActive('/products') ? 'font-bold' : ''}`}
                      href="/products"
                    >
                      Shop
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className={`text-white font-medium hover:text-gray-200 no-underline py-1 md:py-0 block ${isActive('/deals') ? 'font-bold' : ''}`}
                      href="/deals"
                    >
                      Hot Deals
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className={`text-white font-medium hover:text-gray-200 no-underline py-1 md:py-0 block ${isActive('/contact') ? 'font-bold' : ''}`}
                      href="/contact"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Search Form - Desktop with live results */}
              <div className="hidden md:block w-full md:w-auto relative" ref={searchRef}>
                <form className="flex" onSubmit={handleSearch}>
                  <div className="relative">
                    <input 
                      ref={searchInputRef}
                      className="flex-grow px-4 py-2 pl-10 rounded-l-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      type="search" 
                      placeholder="Search products..." 
                      aria-label="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ minWidth: '300px' }}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          setShowSearchResults(true);
                        }
                      }}
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <button 
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r-lg flex items-center"
                    type="submit"
                  >
                    <Search size={18} />
                  </button>
                </form>
                
                {/* Search Results Dropdown */}
                {showSearchResults && (searchQuery.trim() || searchResults.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="p-2 border-b border-gray-100">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">Search Results</h3>
                            <button
                              onClick={handleSearchSubmit}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              See all results →
                            </button>
                          </div>
                        </div>
                        <div className="p-2">
                          {searchResults.map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.slug}`}
                              className="flex items-center p-2 hover:bg-gray-50 rounded transition-colors"
                              onClick={() => {
                                setSearchQuery('');
                                setShowSearchResults(false);
                              }}
                            >
                              <div className="w-10 h-10 rounded bg-gray-100 mr-3 overflow-hidden">
                                <Image
                                  src={getProductImageUrl(product)}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-900 truncate">{product.name}</p>
                                <p className="text-xs text-green-600 font-bold">
                                  KES {product.price.toLocaleString()}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : searchQuery.trim() ? (
                      <div className="p-4 text-center">
                        <p className="text-gray-600">No products found for "{searchQuery}"</p>
                        <button
                          onClick={handleSearchSubmit}
                          className="mt-2 text-sm text-green-600 hover:text-green-700"
                        >
                          Try searching anyway
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* ========== HORIZONTAL CATEGORIES ROW ========== */}
        <div className="hidden md:block bg-white border-t border-b border-gray-200 relative">
          <div className="container mx-auto px-4">
            <div className="flex items-center py-1">
              {/* All Categories Button with Menu Icon */}
              <div 
                className="relative mr-4"
                ref={categoriesMenuRef}
                onMouseEnter={() => setShowAllCategories(true)}
                onMouseLeave={() => setShowAllCategories(false)}
              >
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="flex items-center text-gray-700 hover:text-green-600 font-medium text-sm py-1"
                >
                  <Menu size={18} className="mr-1" />
                  <span>All Categories</span>
                </button>

                {/* All Categories Dropdown */}
                {showAllCategories && categories.length > 0 && (
                  <div 
                    className="absolute left-0 top-full mt-1 w-64 bg-white rounded shadow-lg z-50 border border-gray-200 max-h-96 overflow-y-auto"
                    onMouseEnter={() => setShowAllCategories(true)}
                    onMouseLeave={() => setShowAllCategories(false)}
                  >
                    <div className="p-3 bg-gray-50 border-b">
                      <div className="font-semibold text-gray-800">All Categories</div>
                      <div className="text-xs text-gray-600 mt-1">Browse all product categories</div>
                    </div>
                    <div className="p-2">
                      {categories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.slug}`}
                          className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded text-sm text-gray-700 hover:text-green-600 mb-1"
                          onClick={() => setShowAllCategories(false)}
                        >
                          <div className="flex items-center">
                            <span>{category.name}</span>
                          </div>
                          <ChevronRight size={14} className="text-gray-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Horizontal Categories - No Scroll, Display Fixed Number */}
              <div className="flex-1">
                <div className="flex flex-wrap gap-4 py-1">
                  {isLoadingCategories ? (
                    Array.from({ length: 10 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-4 w-20 bg-gray-200 rounded"></div>
                      </div>
                    ))
                  ) : categories.length > 0 ? (
                    categories.slice(0, 9).map((category) => (
                      <div
                        key={category.id}
                        className="relative"
                        onMouseEnter={() => handleCategoryHover(category)}
                        onMouseLeave={handleCategoryLeave}
                      >
                        <div className="flex items-center">
                          <Link
                            href={`/category/${category.slug}`}
                            className={`text-sm font-medium whitespace-nowrap transition-colors flex items-center ${
                              activeCategory?.id === category.id 
                                ? 'text-green-600 font-semibold' 
                                : 'text-gray-600 hover:text-green-600'
                            }`}
                          >
                            {category.name}
                            <ChevronDown size={14} className="ml-1" />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No categories available</div>
                  )}
                  
                  {categories.length > 6 && (
                    <button
                      onClick={() => setShowAllCategories(true)}
                      className="text-sm font-medium text-gray-500 hover:text-green-600 whitespace-nowrap flex items-center"
                    >
                      More
                      <ChevronDown size={14} className="ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Category Products Dropdown */}
          {activeCategory && (
            <div 
              ref={categoryDropdownRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-50 mt-1"
              onMouseEnter={handleDropdownMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{activeCategory.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">Popular products in this category</p>
                  </div>
                  <Link
                    href={`/category/${activeCategory.slug}`}
                    className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                    onClick={() => {
                      setActiveCategory(null);
                      setCategoryProducts([]);
                    }}
                  >
                    View All
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
                
                {isLoadingProducts ? (
                  <div className="grid grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="animate-pulse">
                        <div className="h-40 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : categoryProducts.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {categoryProducts.slice(0, 8).map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group"
                        onClick={() => {
                          setActiveCategory(null);
                          setCategoryProducts([]);
                        }}
                      >
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                          <Image
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-green-600">
                          {product.name}
                        </h4>
                        <p className="text-green-600 font-bold text-sm mt-1">
                          KES {product.price.toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No products available in this category
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          <div 
            ref={mobileMenuRef}
            className="absolute left-0 top-0 h-full w-4/5 max-w-xs bg-white shadow-2xl transform transition-transform duration-300"
          >
            <div className="h-full flex flex-col">
              <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-green-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <DefaultLogo />
                    <div>
                      <h2 className="text-gray-900 font-bold text-lg">Lando</h2>
                      <p className="text-xs text-gray-600">Hypermarket</p>
                    </div>
                  </div>
                  <button 
                    className="p-2 rounded-full bg-white shadow hover:bg-gray-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X size={20} className="text-gray-600" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    {isAuthenticated && user ? (
                      <span className="text-white font-semibold text-sm">{getUserInitials()}</span>
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  <div>
                    {isAuthenticated && user ? (
                      <>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Link 
                            href="/profile" 
                            className="text-xs text-green-600 hover:text-green-700"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          <span className="text-gray-400">•</span>
                          <button 
                            onClick={handleLogout}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Logout
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-900">Welcome!</p>
                        <Link 
                          href="/login" 
                          className="text-xs text-green-600 hover:text-green-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign in or Create Account
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {mobileMenuCategories.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-green-50 rounded-xl transition-colors border border-gray-200 hover:border-green-200 group"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="p-2 rounded-lg bg-white mb-2 group-hover:bg-green-100 transition-colors">
                        <div className="text-green-600 group-hover:text-green-700">
                          {item.icon}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center">{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-1 mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Navigation</h3>
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className={`p-1.5 rounded ${isActive(item.path) ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Categories</h3>
                    <Link 
                      href="/categories"
                      className="text-xs text-green-600 hover:text-green-700"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      View all
                    </Link>
                  </div>
                  
                  {isLoadingCategories ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-12 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : categories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {categories.slice(0, 8).map((category) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.slug}`}
                          className="flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-200 group"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <span className="text-sm font-medium text-gray-700 group-hover:text-green-600 truncate">
                            {category.name}
                          </span>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 flex-shrink-0 ml-2" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 py-2 text-center">No categories available</div>
                  )}
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Smartphone size={16} className="mr-2 text-green-600" />
                    Contact Us
                  </h3>
                  <p className="text-sm text-gray-700 mb-1">+254 716 354 589</p>
                  <p className="text-xs text-gray-600">24/7 Customer Support</p>
                </div>
              </div>

              <div className="p-5 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-center space-x-4 text-sm font-medium text-gray-600">
                  <Link href="/terms" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600">Terms</Link>
                  <span className="text-gray-400">•</span>
                  <Link href="/privacy" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600">Privacy</Link>
                  <span className="text-gray-400">•</span>
                  <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="hover:text-green-600">Help</Link>
                </div>
                <div className="text-center text-xs text-gray-500 mt-3">
                  © {new Date().getFullYear()} Lando Hypermarket
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <div className="font-bold text-xl text-gray-900">Search Products</div>
                <button 
                  onClick={() => setMobileSearchOpen(false)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={22} />
                </button>
              </div>
              
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <input
                    ref={mobileSearchRef}
                    type="search"
                    placeholder="What are you looking for?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 border-2 border-gray-200 focus:border-green-500 text-sm"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                </div>
              </form>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {isSearching ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Search Results</h3>
                  <div className="space-y-3">
                    {searchResults.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="flex items-center p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-all duration-300 text-left border border-gray-200 hover:border-green-300"
                        onClick={() => setMobileSearchOpen(false)}
                      >
                        <div className="w-16 h-16 rounded-lg bg-gray-100 mr-4 overflow-hidden">
                          <Image
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                            {product.name}
                          </h4>
                          <p className="text-green-600 font-bold">
                            KES {product.price.toLocaleString()}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 ml-2" />
                      </Link>
                    ))}
                  </div>
                </>
              ) : searchQuery.trim() ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">No products found for "{searchQuery}"</p>
                  <button
                    onClick={handleSearchSubmit}
                    className="mt-4 px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm"
                  >
                    Try searching anyway
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Popular Categories</h3>
                  {isLoadingCategories ? (
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="animate-pulse">
                          <div className="h-12 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : categories.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {categories.slice(0, 8).map((category) => (
                        <Link
                          key={category.id}
                          href={`/category/${category.slug}`}
                          className="px-4 py-3 bg-gray-50 hover:bg-green-50 text-gray-700 rounded-lg text-sm font-medium transition-all duration-300 text-left border border-gray-200 hover:border-green-300 hover:text-green-700 flex items-center justify-between"
                          onClick={() => setMobileSearchOpen(false)}
                        >
                          <span className="truncate">{category.name.length > 15 
                            ? category.name.substring(0, 15) + '...' 
                            : category.name}</span>
                          <ChevronRight size={14} className="text-gray-400 flex-shrink-0 ml-2" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 py-4 text-center">No categories available</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;