'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  ShoppingCart, User, Search, Menu, X, Heart, Truck, 
  Phone, ChevronDown, ArrowRight,
  Package, Star, Home, ChevronRight,
  ShoppingBasket,
  Smartphone,
  Award,
  RefreshCw,
  ShieldCheck,
  Apple, Carrot, Coffee, Utensils, Leaf,
  Baby, Droplets, Bug, RefreshCw as RefreshCwIcon,
  PawPrint,
  Briefcase,
  Dumbbell,
  Car,
  TreePine,
  Sprout,
  HeartPulse,
  Pill,
  Shirt,
  Flame,
  MapPin,
  Clock,
  Shield,
  Zap,
  Sparkles,
  Percent,
  Gift,
  Sun,
  ShoppingBag
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Product, Category } from '@/types';

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
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const promoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const categoryHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();

  // Updated Color Scheme with Light Green as Primary, Gold and Warm Orange as accents
  const colors = useMemo(() => ({
    primary: '#90EE90',           // Light Green - Primary
    primaryLight: '#C1FFC1',      // Lighter Green
    primaryDark: '#5CD65C',       // Darker Green
    
    gold: '#FFD700',              // Gold - Accent
    goldLight: '#FFE55C',         // Light Gold
    goldDark: '#B8860B',          // Dark Gold
    
    orange: '#FFA500',            // Warm Orange - Secondary
    orangeLight: '#FFC966',       // Light Orange
    orangeDark: '#CC8400',        // Dark Orange
    
    accent: '#A78BFA',            // Purple - Tertiary
    accentLight: '#C4B5FD',       // Light Purple
    
    warning: '#F59E0B',           // Amber
    success: '#10b981',           // Emerald
    
    dark: '#1f2937',              // Dark Gray
    light: '#ffffff',             // White
    gray: '#6b7280',              // Gray
    grayLight: '#f8fafc',         // Light Gray
    grayMedium: '#e2e8f0',        // Medium Gray
    grayDark: '#94a3b8'           // Dark Gray
  }), []);

  // ========== FETCH CATEGORIES ==========
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const response = await api.categories.getAll();
      const categoriesData = response.data || [];
      setAllCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // ========== FETCH PRODUCTS FOR CATEGORY ==========
  const fetchProductsForCategory = useCallback(async (categoryId: string | number) => {
    try {
      const response = await api.products.getAll({ 
        category_id: categoryId,
        per_page: 100,
        sort: 'created_at',
        order: 'desc'
      });
      const products = response.data?.data || response.data || [];
      setCategoryProducts(products);
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Get top categories
  const topCategories = useMemo(() => {
    return allCategories
      .filter(cat => (cat.active_products_count || 0) > 0 && cat.parent_id === null)
      .sort((a, b) => (b.active_products_count || 0) - (a.active_products_count || 0))
      .slice(0, 6);
  }, [allCategories]);

  // Handle category hover with delay
  const handleCategoryHover = useCallback((category: Category) => {
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }

    categoryHoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(category.slug);
      fetchProductsForCategory(category.id);
    }, 200);
  }, [fetchProductsForCategory]);

  // Handle category leave with delay
  const handleCategoryLeave = useCallback(() => {
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }

    categoryHoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setCategoryProducts([]);
    }, 300);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    const throttledScroll = debounce(handleScroll, 50);
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
    if (mobileMenuOpen || searchOpen || mobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen, searchOpen, mobileSearchOpen]);

  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
      try {
        if (isAuthenticated && !authLoading) {
          // Fetch user-specific data
        } else {
          // Load cart from localStorage
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

  // Event Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setSearchOpen(false);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
      router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, router]);

  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchOpen(false);
    setMobileSearchOpen(false);
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

  // User info
  const userInitial = useMemo(() => 
    user?.name?.charAt(0).toUpperCase() || 'U', [user?.name]
  );

  const userFirstName = useMemo(() => 
    user?.name?.split(' ')[0] || 'Guest', [user?.name]
  );

  const displayCartCount = useMemo(() => 
    cartCount > 99 ? '99+' : cartCount, [cartCount]
  );

  const quickSearches = useMemo(() => [
    'Fresh Vegetables', 'Organic Fruits', 'Dairy Products', 'Bakery Items',
    'Coffee & Tea', 'Snacks', 'Cleaning Supplies', 'Personal Care',
    'Baby Products', 'Pet Food', 'Kitchen Essentials', 'Beverages'
  ], []);

  // Check active link
  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  }, [pathname]);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (categoryHoverTimeoutRef.current) {
        clearTimeout(categoryHoverTimeoutRef.current);
      }
    };
  }, []);

  // Handle product click
  const handleProductClick = (productSlug: string) => {
    setActiveCategory(null);
    setCategoryProducts([]);
    router.push(`/products/${productSlug}`);
  };

  // Helper function to get complete image URL
  const getImageUrl = (product: Product) => {
    if (product.main_image) {
      return product.main_image;
    }
    
    const imageUrl = product.thumbnail || product.gallery?.[0] || product.images?.[0];
    
    if (!imageUrl) {
      return '/images/placeholder.jpg';
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    if (cleanPath.startsWith('storage/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/${cleanPath}`;
    }
    
    if (cleanPath.startsWith('products/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/storage/${cleanPath}`;
    }
    
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/storage/${cleanPath}`;
  };

  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Fruits': <Apple size={18} />,
      'Vegetables': <Carrot size={18} />,
      'Beverages': <Coffee size={18} />,
      'Cleaning': <Sparkles size={18} />,
      'Household': <Home size={18} />,
      'Disposables': <Utensils size={18} />,
      'Garbage': <Package size={18} />,
      'Insect': <Bug size={18} />,
      'Pest': <Bug size={18} />,
      'Laundry': <RefreshCwIcon size={18} />,
      'Detergents': <RefreshCwIcon size={18} />,
      'Tissues': <Package size={18} />,
      'Eco': <Leaf size={18} />,
      'Green': <Sprout size={18} />,
      'Baby': <Baby size={18} />,
      'Health': <HeartPulse size={18} />,
      'Wellness': <HeartPulse size={18} />,
      'Beauty': <Droplets size={18} />,
      'Personal Care': <Droplets size={18} />,
      'Pet': <PawPrint size={18} />,
      'Office': <Briefcase size={18} />,
      'School': <Briefcase size={18} />,
      'Automotive': <Car size={18} />,
      'Sports': <Dumbbell size={18} />,
      'Outdoors': <Dumbbell size={18} />,
      'Electronics': <Smartphone size={18} />,
      'Clothing': <Shirt size={18} />,
      'Accessories': <Shirt size={18} />,
      'Home': <TreePine size={18} />,
      'Garden': <TreePine size={18} />,
      'Default': <Package size={18} />
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryName.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return iconMap['Default'];
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(144, 238, 144, 0.3); }
          50% { box-shadow: 0 0 30px rgba(144, 238, 144, 0.5); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-pulse-slow { animation: pulse 2s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(135deg, #FFA500 0%, #CC8400 100%);
          color: white;
          font-size: 10px;
          font-weight: 800;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(255, 165, 0, 0.4);
        }
        
        .header-shadow {
          box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }
        
        .dropdown-shadow {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
        }
        
        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          animation: fadeIn 0.3s ease-in-out;
        }

        .product-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.5);
          background: white;
        }

        .product-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          border-color: #90EE90;
        }

        .category-scroll {
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          gap: 12px;
          flex: 1;
          min-width: 0;
          padding: 4px 0;
        }
        
        .category-scroll::-webkit-scrollbar {
          display: none;
        }

        .search-glow {
          box-shadow: 0 8px 30px rgba(144, 238, 144, 0.15);
          border: 2px solid rgba(144, 238, 144, 0.2);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
        }
        
        .search-glow:focus-within {
          box-shadow: 0 12px 40px rgba(144, 238, 144, 0.25);
          border-color: #90EE90;
        }

        .gradient-bg {
          background: linear-gradient(135deg, #F0FFF0 0%, #FFFAF0 100%);
        }

        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>

    
      {/* Main Header */}
      <header className={`sticky top-0 z-50 gradient-bg transition-all duration-300 ${scrolled ? 'header-shadow' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* First Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <button 
                className="lg:hidden p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-all duration-300"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} className="text-gray-800" />
              </button>

              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-500 border-4 border-white animate-glow">
                  <Image 
                    src="/logo.jpeg" 
                    alt="Lando Ranch Logo" 
                    fill
                    className="object-cover"
                    sizes="48px"
                    priority
                  />
                </div>
                <div className="hidden sm:block">
                  <div className="text-2xl font-black text-gray-900 tracking-tight bg-gradient-to-r from-green-400 to-yellow-500 bg-clip-text text-transparent">
                    Lando
                  </div>
                  <div className="text-xs font-bold text-gray-600 -mt-1 tracking-wider">Hypermarket</div>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar - Centered and Bright */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="search-glow rounded-2xl overflow-hidden transition-all duration-500">
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center justify-center pointer-events-none">
                      <Search size={20} className="text-green-500" />
                    </div>
                    <input
                      type="search"
                      placeholder="Discover amazing products... Search groceries, electronics, home essentials and more!"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3 pl-12 bg-transparent focus:outline-none text-gray-900 placeholder-gray-500 text-sm placeholder:font-medium"
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:from-green-500 hover:to-emerald-600 transition-all duration-300 font-bold text-sm flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!searchQuery.trim()}
                    >
                      <Search size={18} />
                      <span>SEARCH</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search */}
              <button 
                className="lg:hidden p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-colors"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={20} className="text-gray-800" />
              </button>

              {/* Wishlist */}
              <Link 
                href="/wishlist" 
                className="hidden lg:flex relative p-2 hover:scale-110 transition-all duration-300 group"
                aria-label="Wishlist"
              >
                <div className="relative p-2 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 group-hover:border-yellow-300 transition-colors">
                  <Heart size={20} className="text-yellow-500 group-hover:text-yellow-600 transition-colors" />
                </div>
                {wishlistCount > 0 && (
                  <div className="cart-badge">
                    {wishlistCount}
                  </div>
                )}
              </Link>

              {/* User Account - Desktop */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1 hover:scale-105 transition-all duration-300 group"
                  aria-label="Account menu"
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-2xl overflow-hidden border-3 border-white shadow-lg group-hover:shadow-xl transition-shadow">
  {user?.profile_picture_url ? (  // CHANGED: profile_picture → profile_picture_url
    <Image
      src={user.profile_picture_url}  // CHANGED: profile_picture → profile_picture_url
      alt="Profile"
      width={40}
      height={40}
      className="object-cover w-full h-full"
    />
  ) : (
    <div className="w-full h-full bg-gradient-to-br from-green-400 via-yellow-400 to-orange-400 flex items-center justify-center">
      <User size={20} className="text-white" />
    </div>
  )}
</div>
                    {isAuthenticated && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Welcome back!</div>
                    <div className="text-sm font-bold text-gray-900 flex items-center">
                      {isAuthenticated ? userFirstName : 'Sign In'}
                      <ChevronDown size={14} className="ml-1.5 text-gray-500 group-hover:text-green-500" />
                    </div>
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 rounded-2xl z-50 animate-fadeIn dropdown-shadow overflow-hidden backdrop-blur-lg">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-yellow-50 border-b border-gray-100/50">
                      <div className="font-bold text-gray-900 text-lg">My Account</div>
                      {isAuthenticated && user?.email && (
                        <div className="text-sm text-gray-600 mt-1 truncate">{user.email}</div>
                      )}
                    </div>
                    <div className="p-3">
                      {isAuthenticated ? (
                        <>
                          <div className="grid grid-cols-2 gap-3 p-2">
                            <Link 
                              href="/orders" 
                              className="flex flex-col items-center p-3 hover:bg-green-50 rounded-xl transition-colors group border border-gray-100 hover:border-green-200"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 mb-2">
                                <ShoppingBag size={18} className="text-green-600" />
                              </div>
                              <div className="font-semibold text-sm">Orders</div>
                            </Link>
                            <Link 
                              href="/wishlist" 
                              className="flex flex-col items-center p-3 hover:bg-yellow-50 rounded-xl transition-colors group border border-gray-100 hover:border-yellow-200"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-100 to-amber-100 mb-2">
                                <Heart size={18} className="text-yellow-600" />
                              </div>
                              <div className="font-semibold text-sm">Wishlist</div>
                            </Link>
                          </div>
                          
                          <div className="space-y-2 p-2">
                            <Link 
                              href="/profile" 
                              className="flex items-center px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User size={16} className="mr-3 text-gray-500 group-hover:text-green-600" />
                              <span className="font-semibold">My Profile</span>
                            </Link>
                            <Link 
                              href="/addresses" 
                              className="flex items-center px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <MapPin size={16} className="mr-3 text-gray-500 group-hover:text-green-600" />
                              <span className="font-semibold">Addresses</span>
                            </Link>
                          </div>
                          
                          <div className="border-t border-gray-100/50 my-3"></div>
                          
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 rounded-xl text-sm font-bold transition-all duration-300 shadow hover:shadow-lg mt-1"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-3 space-y-4">
                            <Link 
                              href="/auth/login" 
                              className="block px-3 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold text-center hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Sign In to Your Account
                            </Link>
                            <div className="text-center text-sm text-gray-600">
                              New customer?{' '}
                              <Link 
                                href="/auth/register" 
                                className="text-green-600 font-bold hover:underline"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                Create Account
                              </Link>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Account - Mobile */}
              <Link 
                href={isAuthenticated ? "/profile" : "/auth/login"}
                className="lg:hidden p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm transition-colors"
                aria-label="Account"
              >
                <User size={20} className="text-gray-800" />
              </Link>

              {/* Cart - Bright and Prominent */}
              <Link 
                href="/cart" 
                className="relative group"
                aria-label="Shopping cart"
              >
                <div className="flex items-center space-x-2 p-1 hover:scale-105 transition-all duration-300">
                  <div className="relative">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 group-hover:from-orange-500 group-hover:to-amber-600 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <ShoppingCart size={22} className="text-white" />
                    </div>
                    {cartCount > 0 && (
                      <div className="cart-badge">
                        {displayCartCount}
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:block">
                    <div className="text-xs text-gray-600">Total</div>
                    <div className="text-md font-bold text-gray-900">KSh 0.00</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* ========== NAVIGATION BAR - Bright & Attractive ========== */}
          <div className="hidden lg:block py-2 border-t border-gray-100/50 relative">
            <div className="flex items-center justify-between">
              {/* Left: All Categories */}
              <div className="relative" ref={categoriesMenuRef}>
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl ${
                    showAllCategories 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                      : 'bg-gradient-to-r from-white to-gray-50 text-gray-800 hover:from-green-50 hover:to-emerald-50 border border-gray-200'
                  }`}
                >
                  <Menu size={20} />
                  <span className="font-bold text-sm">ALL CATEGORIES</span>
                  <ChevronDown size={16} />
                </button>

                {/* All Categories Dropdown */}
                {showAllCategories && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-96 bg-white/95 rounded-2xl z-50 animate-fadeIn dropdown-shadow overflow-hidden backdrop-blur-lg"
                    onMouseLeave={() => setShowAllCategories(false)}
                  >
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-gray-900 mb-1 bg-gradient-to-r from-green-500 to-yellow-500 bg-clip-text text-transparent">Shop Categories</h3>
                      <p className="text-gray-600 text-sm mb-6">Browse our extensive collection</p>
                      <div className="grid grid-cols-2 gap-3">
                        {allCategories
                          .filter(cat => cat.parent_id === null)
                          .slice(0, 12)
                          .map((category) => (
                            <Link
                              key={category.id}
                              href={`/categories/${category.slug}`}
                              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 transition-all duration-300 group border border-gray-100 hover:border-green-200"
                              onClick={() => setShowAllCategories(false)}
                            >
                              <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 group-hover:from-green-200 group-hover:to-emerald-200 transition-all">
                                <div className="text-green-600 group-hover:text-green-700">
                                  {getCategoryIcon(category.name)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-gray-900 text-sm group-hover:text-green-700 transition-colors">
                                  {category.name}
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-400 group-hover:text-green-500" />
                            </Link>
                          ))}
                      </div>
                      <div className="mt-6 pt-6 border-t border-gray-100/50">
                        <Link
                          href="/categories"
                          className="flex items-center justify-center px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow hover:shadow-lg font-bold text-sm"
                          onClick={() => setShowAllCategories(false)}
                        >
                          Explore All Categories
                          <ArrowRight size={16} className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Center: Navigation Links - Bright & Vibrant */}
              <div className="flex items-center space-x-6">
                <Link
                  href="/"
                  className={`font-bold text-sm px-3 py-2 rounded-xl transition-all duration-300 ${
                    isActive('/') 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                      : 'text-gray-700 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/products"
                  className={`font-bold text-sm px-3 py-2 rounded-xl transition-all duration-300 ${
                    isActive('/products') 
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg' 
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-yellow-50'
                  }`}
                >
                  Shop All
                </Link>
                <Link
                  href="/deals"
                  className={`font-bold text-sm px-3 py-2 rounded-xl transition-all duration-300 flex items-center ${
                    isActive('/deals') 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' 
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <Zap size={16} className="mr-2" />
                  Hot Deals
                </Link>
                <Link
                  href="/new-arrivals"
                  className={`font-bold text-sm px-3 py-2 rounded-xl transition-all duration-300 flex items-center ${
                    isActive('/new-arrivals') 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' 
                      : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <Sparkles size={16} className="mr-2" />
                  New Arrivals
                </Link>
              </div>

              {/* Right: Quick Info */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm">
                  <ShieldCheck size={16} className="text-green-500" />
                  <span className="font-semibold text-gray-700">Secure</span>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <Phone size={16} className="text-yellow-500" />
                  <span className="font-semibold text-gray-700">+254 716 354589</span>
                </div>
              </div>
            </div>

            {/* Category Products Dropdown */}
            {activeCategory && categoryProducts.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-2 bg-white/95 rounded-2xl z-50 animate-fadeIn dropdown-shadow backdrop-blur-lg"
                onMouseEnter={() => {
                  if (categoryHoverTimeoutRef.current) {
                    clearTimeout(categoryHoverTimeoutRef.current);
                  }
                }}
                onMouseLeave={handleCategoryLeave}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {topCategories.find(c => c.slug === activeCategory)?.name}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm">
                        Discover our premium collection
                      </p>
                    </div>
                    <Link
                      href={`/categories/${activeCategory}`}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 font-bold text-sm rounded-xl transition-all duration-300 shadow hover:shadow-lg flex items-center space-x-2"
                      onClick={() => {
                        setActiveCategory(null);
                        setCategoryProducts([]);
                      }}
                    >
                      <span>View All</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="product-grid">
                    {categoryProducts.slice(0, 6).map((product) => {
                      const ProductItem = ({ product }: { product: Product }) => {
                        const [imageLoaded, setImageLoaded] = useState(false);
                        const [imageError, setImageError] = useState(false);
                        const imageUrl = getImageUrl(product);
                        
                        return (
                          <div
                            onClick={() => handleProductClick(product.slug)}
                            className="product-item group"
                          >
                            {/* Product Image */}
                            <div className="aspect-square bg-gradient-to-br from-green-50 to-yellow-50 overflow-hidden relative rounded-t-xl">
                              {!imageError ? (
                                <Image
                                  src={imageUrl}
                                  alt={product.name || 'Product image'}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className={`object-cover transition-transform duration-700 ${
                                    imageLoaded ? 'group-hover:scale-110 opacity-100' : 'opacity-0'
                                  }`}
                                  onLoad={() => {
                                    setImageLoaded(true);
                                  }}
                                  onError={() => {
                                    setImageError(true);
                                    setImageLoaded(true);
                                  }}
                                  loading="lazy"
                                  quality={90}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-yellow-100">
                                  <Package size={40} className="text-gray-400" />
                                </div>
                              )}
                              {!imageLoaded && !imageError && (
                                <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-yellow-100 animate-pulse"></div>
                              )}
                              
                              {/* Discount Badge */}
                              {product.discounted_price && Number(product.discounted_price) < Number(product.price) && (
                                <div className="absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-lg shadow-lg">
                                  -{Math.round((1 - Number(product.discounted_price) / Number(product.price)) * 100)}% OFF
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-4">
                              <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-3 h-10">
                                {product.name}
                              </h4>
                              
                              {/* Price */}
                              <div className="space-y-2">
                                <div className="font-bold text-gray-900 text-lg">
                                  {formatPrice(Number(product.discounted_price || product.price))}
                                </div>
                                {product.discounted_price && Number(product.discounted_price) < Number(product.price) && (
                                  <div className="text-sm text-gray-500 line-through">
                                    {formatPrice(Number(product.price))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Rating */}
                              {product.rating && Number(product.rating) > 0 && (
                                <div className="flex items-center space-x-2 mt-3">
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        size={14} 
                                        className={`${
                                          i < Math.floor(Number(product.rating)) 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : 'fill-gray-200 text-gray-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-semibold text-gray-700">{Number(product.rating).toFixed(1)}</span>
                                </div>
                              )}
                              
                              {/* CTA */}
                              <button className="w-full mt-4 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 rounded-lg text-sm font-bold transition-all duration-300 shadow hover:shadow-md">
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        );
                      };

                      return <ProductItem key={product.id} product={product} />;
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu - Bright & Modern */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-green-500/20 via-yellow-500/20 to-orange-500/20 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white/95 shadow-2xl animate-slideIn backdrop-blur-lg">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-gray-100/50">
                  <div className="flex items-center justify-between mb-5">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border-4 border-white shadow">
                        <Image 
                          src="/logo.jpeg" 
                          alt="Logo"
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-black text-gray-900 text-md">Lando</div>
                        <div className="text-xs text-green-600 font-bold">Hypermarket</div>
                      </div>
                    </Link>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  
                  {/* User Info */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50 to-yellow-50 rounded-2xl border border-green-200">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden border-4 border-white shadow">
                        {user?.profile_picture_url ? (  // CHANGED: profile_picture → profile_picture_url
                          <Image
                            src={user.profile_picture_url}  // CHANGED: profile_picture → profile_picture_url
                            alt="Profile"
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-yellow-400 flex items-center justify-center">
                            <User size={22} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 truncate">{user?.name}</div>
                        <div className="text-sm text-gray-600 truncate">{user?.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link 
                        href="/auth/login" 
                        className="block py-3 text-center bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-sm shadow-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In / Register
                      </Link>
                    </div>
                  )}
                </div>

                {/* Menu Content */}
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/deals"
                        className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 text-center group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 w-fit mx-auto mb-2">
                          <Flame size={22} className="text-white" />
                        </div>
                        <div className="font-bold text-gray-900">Hot Deals</div>
                        <div className="text-xs text-gray-600 mt-1">Limited time offers</div>
                      </Link>
                      <Link
                        href="/cart"
                        className="p-3 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 text-center group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 w-fit mx-auto mb-2">
                          <ShoppingCart size={22} className="text-white" />
                        </div>
                        <div className="font-bold text-gray-900">My Cart</div>
                        <div className="text-xs text-gray-600 mt-1">{cartCount} items</div>
                      </Link>
                    </div>

                    {/* Navigation */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-gray-900 text-sm mb-2 uppercase tracking-wider text-gray-500">Shop</h3>
                      <Link
                        href="/products"
                        className="flex items-center justify-between p-3 hover:bg-green-50 rounded-xl transition-colors group border border-gray-100 hover:border-green-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-green-100 mr-3">
                            <ShoppingBag size={18} className="text-green-600" />
                          </div>
                          <span className="font-bold">All Products</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500" />
                      </Link>
                      <Link
                        href="/categories"
                        className="flex items-center justify-between p-3 hover:bg-yellow-50 rounded-xl transition-colors group border border-gray-100 hover:border-yellow-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-yellow-100 mr-3">
                            <Package size={18} className="text-yellow-600" />
                          </div>
                          <span className="font-bold">Categories</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-yellow-500" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100/50">
                  <div className="flex items-center justify-center space-x-4 text-sm font-semibold text-gray-700">
                    <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>Terms</Link>
                    <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
                    <Link href="/help" onClick={() => setMobileMenuOpen(false)}>Help</Link>
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-3 font-medium">
                    © {new Date().getFullYear()} Lando Ranch Premium Supermarket
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-gradient-to-b from-white to-green-50">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-gray-100/50">
                <div className="flex items-center justify-between mb-5">
                  <div className="font-bold text-xl text-gray-900">Search</div>
                  <button 
                    onClick={() => setMobileSearchOpen(false)}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                  >
                    <X size={22} />
                  </button>
                </div>
                
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="What are you looking for?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 border-2 border-gray-200 focus:border-green-500 text-sm shadow-lg"
                      autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                  </div>
                </form>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Popular Searches */}
                {searchQuery.trim() === '' && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Popular Searches</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickSearches.slice(0, 8).map((item) => (
                        <button
                          key={item}
                          onClick={() => handleQuickSearch(item)}
                          className="px-3 py-2.5 bg-white hover:bg-green-50 text-gray-700 rounded-xl text-sm font-bold transition-all duration-300 text-left border border-gray-200 hover:border-green-300 hover:shadow-lg"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Categories */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Categories</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {topCategories.slice(0, 6).map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex items-center p-3 bg-white hover:bg-gradient-to-r hover:from-green-50 hover:to-yellow-50 rounded-xl transition-all duration-300 border border-gray-200 hover:border-green-300 hover:shadow-lg"
                        onClick={() => setMobileSearchOpen(false)}
                      >
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 mr-2">
                          <div className="text-green-600">
                            {getCategoryIcon(category.name)}
                          </div>
                        </div>
                        <span className="font-bold text-sm">{category.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;