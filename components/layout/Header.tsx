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
  Globe,
  Award,
  RefreshCw,
  ShieldCheck,
  Trash2,
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
  Shirt
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

  // Light Green & Warm Orange Color Scheme
  const colors = useMemo(() => ({
    primary: '#22c55e', // Light Green
    primaryLight: '#4ade80',
    primaryDark: '#16a34a',
    secondary: '#f97316', // Warm Orange
    secondaryLight: '#fb923c',
    secondaryDark: '#ea580c',
    accent: '#3b82f6', // Blue for contrast
    accentLight: '#60a5fa',
    warning: '#f59e0b',
    success: '#22c55e',
    dark: '#1f2937',
    light: '#ffffff',
    gray: '#6b7280',
    grayLight: '#f9fafb',
    grayMedium: '#e5e7eb'
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

  // ========== FETCH PROMOTIONAL PRODUCTS ==========
  const fetchPromotionalProducts = useCallback(async () => {
    try {
      setIsPromoLoading(true);
      
      const response = await api.products.getAll({ 
        per_page: 10,
        sort: 'discount',
        order: 'desc',
        discount_min: 10
      });
      
      let products: Product[] = response.data?.data || response.data || [];
      
      if (products.length < 4) {
        const featuredRes = await api.products.getFeatured();
        const featuredProducts = featuredRes.data || [];
        const existingIds = new Set(products.map(p => p.id));
        const additionalProducts = featuredProducts.filter((p: Product) => !existingIds.has(p.id));
        products = [...products, ...additionalProducts].slice(0, 10);
      }
      
      if (products.length < 4) {
        const newArrivalsRes = await api.products.getAll({ 
          per_page: 4,
          sort: 'created_at',
          order: 'desc'
        });
        const newProducts = newArrivalsRes.data?.data || newArrivalsRes.data || [];
        products = [...products, ...newProducts].slice(0, 10);
      }
      
      setPromoProducts(products);
      
      if (products.length > 1) {
        if (promoIntervalRef.current) {
          clearInterval(promoIntervalRef.current);
        }
        
        promoIntervalRef.current = setInterval(() => {
          setCurrentPromoIndex(prev => (prev + 1) % Math.min(products.length, 4));
        }, 5000);
      }
      
    } catch (error) {
      console.error('Failed to fetch promotional products:', error);
    } finally {
      setIsPromoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotionalProducts();
    
    return () => {
      if (promoIntervalRef.current) {
        clearInterval(promoIntervalRef.current);
      }
    };
  }, [fetchPromotionalProducts]);

  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'Fruits': <Apple size={16} />,
      'Vegetables': <Carrot size={16} />,
      'Beverages': <Coffee size={16} />,
      'Cleaning': <Home size={16} />,
      'Household': <Home size={16} />,
      'Disposables': <Utensils size={16} />,
      'Garbage': <Trash2 size={16} />,
      'Insect': <Bug size={16} />,
      'Pest': <Bug size={16} />,
      'Laundry': <RefreshCwIcon size={16} />,
      'Detergents': <RefreshCwIcon size={16} />,
      'Tissues': <Pill size={16} />,
      'Eco': <Leaf size={16} />,
      'Green': <Sprout size={16} />,
      'Baby': <Baby size={16} />,
      'Health': <HeartPulse size={16} />,
      'Wellness': <HeartPulse size={16} />,
      'Beauty': <Droplets size={16} />,
      'Personal Care': <Droplets size={16} />,
      'Pet': <PawPrint size={16} />,
      'Office': <Briefcase size={16} />,
      'School': <Briefcase size={16} />,
      'Automotive': <Car size={16} />,
      'Sports': <Dumbbell size={16} />,
      'Outdoors': <Dumbbell size={16} />,
      'Electronics': <Smartphone size={16} />,
      'Clothing': <Shirt size={16} />,
      'Accessories': <Shirt size={16} />,
      'Home': <TreePine size={16} />,
      'Garden': <TreePine size={16} />,
      'Default': <Package size={16} />
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryName.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return iconMap['Default'];
  };

  // Get top categories (with products, limited to 5 to prevent overlap)
  const topCategories = useMemo(() => {
    return allCategories
      .filter(cat => (cat.active_products_count || 0) > 0 && cat.parent_id === null)
      .sort((a, b) => (b.active_products_count || 0) - (a.active_products_count || 0))
      .slice(0, 5);
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

  // Quick Links with Icons
  const quickLinks = useMemo(() => [
    { 
      id: 'delivery', 
      name: 'Fast Delivery', 
      icon: Truck,
      desc: '1-2 Hour Delivery',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      id: 'pickup', 
      name: 'Store Pickup', 
      icon: Package,
      desc: 'Pickup in 30min',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    },
    { 
      id: 'quality', 
      name: 'Quality Promise', 
      icon: Award,
      desc: '100% Fresh',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      id: 'returns', 
      name: 'Easy Returns', 
      icon: RefreshCw,
      desc: '30-Day Returns',
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
  ], []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
    // Priority 1: Use main_image from API (already a complete URL)
    if (product.main_image) {
      return product.main_image;
    }
    
    // Priority 2: Use thumbnail or gallery URLs if they're complete URLs
    const imageUrl = product.thumbnail || product.gallery?.[0] || product.images?.[0];
    
    if (!imageUrl) {
      return '/images/placeholder.jpg';
    }
    
    // If it's already a full URL, return it
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // Otherwise, construct the URL
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    
    // Check if it's a storage path
    if (cleanPath.startsWith('storage/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/${cleanPath}`;
    }
    
    // Check if it's a products path
    if (cleanPath.startsWith('products/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/storage/${cleanPath}`;
    }
    
    // Default case
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/storage/${cleanPath}`;
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slideInLeft { animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-pulse-slow { animation: pulse 2s infinite; }
        .animate-float { animation: float 2.5s ease-in-out infinite; }
        
        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
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
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
        }
        
        .search-glow {
          box-shadow: 0 0 0 1px #e5e7eb, 0 4px 12px rgba(34, 197, 94, 0.1);
        }
        
        .search-glow:focus-within {
          box-shadow: 0 0 0 2px #22c55e, 0 6px 20px rgba(34, 197, 94, 0.15);
        }
        
        .dropdown-shadow {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 4px;
        }

        /* Category Display Styles */
        .category-scroll {
          display: flex;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #22c55e #f3f4f6;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        
        .category-scroll::-webkit-scrollbar {
          height: 6px;
        }
        
        .category-scroll::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        
        .category-scroll::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 3px;
        }
        
        .category-tab {
          position: relative;
          transition: all 0.2s ease;
          white-space: nowrap;
          min-width: 160px;
        }
        
        .category-tab:hover {
          background: linear-gradient(135deg, #f0fdf4 0%, #fff7ed 100%);
          transform: translateY(-2px);
        }
        
        .category-tab.active {
          background: linear-gradient(135deg, #dcfce7 0%, #ffedd5 100%);
          border-color: #22c55e;
        }
        
        .category-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #22c55e 0%, #f97316 100%);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          animation: fadeIn 0.3s ease-in-out;
        }

        .product-item {
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .product-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Delivery Banner Styles - REDUCED HEIGHT */
        .delivery-banner {
          background: linear-gradient(135deg, #f0fdf4 0%, #ffedd5 50%, #dbeafe 100%);
          background-size: 200% 200%;
          animation: gradientShift 6s ease infinite;
          border-bottom: 1px solid #e5e7eb;
        }

        .vehicle-glow {
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
        }
      `}</style>

      {/* COMPACT DELIVERY BANNER - Matches other navbar padding */}
      <div className="hidden lg:block delivery-banner py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left: Vehicle Images and Compact Text */}
            <div className="flex items-center space-x-4">
              {/* Compact Vehicle Images */}
              <div className="flex items-center space-x-1">
                <div className="vehicle-glow animate-float" style={{ animationDelay: '0s' }}>
                  <svg width="50" height="25" viewBox="0 0 200 100" className="text-green-600">
                    <g transform="translate(0, 20)">
                      <rect x="20" y="30" width="140" height="40" rx="5" fill="currentColor" opacity="0.9"/>
                      <rect x="30" y="15" width="60" height="25" rx="3" fill="currentColor" opacity="0.9"/>
                      <rect x="35" y="18" width="50" height="10" rx="2" fill="#93c5fd" opacity="0.8"/>
                      <circle cx="50" cy="75" r="10" fill="#1f2937"/>
                      <circle cx="50" cy="75" r="4" fill="#6b7280"/>
                      <circle cx="130" cy="75" r="10" fill="#1f2937"/>
                      <circle cx="130" cy="75" r="4" fill="#6b7280"/>
                      <circle cx="165" cy="45" r="5" fill="#fbbf24"/>
                      <circle cx="165" cy="55" r="5" fill="#fbbf24"/>
                    </g>
                  </svg>
                </div>
                
                <div className="vehicle-glow animate-float" style={{ animationDelay: '0.5s' }}>
                  <svg width="40" height="25" viewBox="0 0 150 100" className="text-orange-500">
                    <g transform="translate(0, 30)">
                      <path d="M20,40 Q40,20 70,20 Q100,20 120,40" stroke="currentColor" strokeWidth="5" fill="none"/>
                      <circle cx="40" cy="45" r="12" fill="currentColor"/>
                      <circle cx="40" cy="45" r="4" fill="#6b7280"/>
                      <circle cx="100" cy="45" r="12" fill="currentColor"/>
                      <circle cx="100" cy="45" r="4" fill="#6b7280"/>
                      <circle cx="60" cy="15" r="8" fill="#374151"/>
                      <path d="M60,23 L60,40 L40,50" stroke="#374151" strokeWidth="3" fill="none"/>
                      <path d="M60,40 L80,50" stroke="#374151" strokeWidth="3" fill="none"/>
                      <line x1="70" y1="15" x2="90" y2="25" stroke="#374151" strokeWidth="3"/>
                      <line x1="90" y1="25" x2="95" y2="20" stroke="#374151" strokeWidth="3"/>
                    </g>
                  </svg>
                </div>
              </div>
              
              {/* Compact Delivery Text */}
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <Truck size={16} className="text-green-600" />
                  <span className="text-sm font-semibold text-gray-900">Instant Delivery</span>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-slow"></div>
                </div>
                <p className="text-xs text-gray-700 mt-0.5">
                  <span className="font-medium text-green-700">Van & Motorcycle delivery</span> • 
                  <span className="font-medium text-orange-600"> Order before 4 PM</span>
                </p>
              </div>
            </div>
            
            {/* Right: Compact Delivery Info */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">1-2 HRS</div>
                <div className="text-xs text-gray-600">Van</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">30-60 MIN</div>
                <div className="text-xs text-gray-600">Motorcycle</div>
              </div>
              <div>
                <Link 
                  href="/delivery-info"
                  className="px-4 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-sm hover:shadow text-xs flex items-center space-x-1"
                >
                  <Truck size={12} />
                  <span>Zones</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-xl' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* First Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={22} className="text-gray-700" />
              </button>

              <Link href="/" className="flex items-center space-x-2 group">
                <div className="relative w-10 h-10">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg shadow group-hover:shadow-md transition-shadow duration-300 overflow-hidden">
                    <img 
                      src="/logo.jpeg" 
                      alt="Lando Ranch Logo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-black text-gray-900 tracking-tight">
                    Lando
                  </div>
                  <div className="text-xs font-medium text-green-500 -mt-1">Hypermarket</div>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="search-glow rounded-lg overflow-hidden transition-all duration-300">
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center justify-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="search"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2.5 pl-10 bg-gray-50 focus:outline-none text-gray-900 placeholder-gray-500 text-sm"
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold text-xs flex items-center space-x-1"
                      disabled={!searchQuery.trim()}
                    >
                      <Search size={16} />
                      <span>SEARCH</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile Search */}
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={20} className="text-gray-700" />
              </button>

              {/* Wishlist */}
              <Link 
                href="/wishlist" 
                className="hidden lg:flex relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                aria-label="Wishlist"
              >
                <Heart size={20} className="text-gray-700 group-hover:text-red-500 transition-colors" />
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
                  className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Account menu"
                >
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-sm">
                    {isAuthenticated ? userInitial : <User size={16} />}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-xs text-gray-500">Welcome!</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {isAuthenticated ? userFirstName : 'Sign In'}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fadeIn dropdown-shadow overflow-hidden">
                    <div className="p-3 bg-gradient-to-r from-green-50 to-orange-50 border-b">
                      <div className="font-semibold text-gray-900 text-sm">My Account</div>
                      {isAuthenticated && user?.email && (
                        <div className="text-xs text-gray-600 mt-0.5 truncate">{user.email}</div>
                      )}
                    </div>
                    <div className="p-1.5">
                      {isAuthenticated ? (
                        <>
                          <Link 
                            href="/orders" 
                            className="flex items-center px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package size={16} className="mr-2 text-gray-500 group-hover:text-green-500" />
                            <div>
                              <div className="font-medium">My Orders</div>
                              <div className="text-xs text-gray-500">Track & manage</div>
                            </div>
                          </Link>
                          <Link 
                            href="/wishlist" 
                            className="flex items-center px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Heart size={16} className="mr-2 text-gray-500 group-hover:text-red-500" />
                            <div>
                              <div className="font-medium">Wishlist</div>
                              <div className="text-xs text-gray-500">Saved items</div>
                            </div>
                          </Link>
                          <Link 
                            href="/profile" 
                            className="flex items-center px-3 py-2 hover:bg-gray-50 rounded text-sm transition-colors group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={16} className="mr-2 text-gray-500 group-hover:text-blue-500" />
                            <div>
                              <div className="font-medium">Profile</div>
                              <div className="text-xs text-gray-500">Settings</div>
                            </div>
                          </Link>
                          <div className="border-t my-1.5"></div>
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-medium transition-colors"
                          >
                            <span>Sign Out</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link 
                            href="/auth/login" 
                            className="block px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded text-sm text-center font-semibold mb-1.5 hover:from-green-600 hover:to-green-700 transition-all duration-300"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                          <div className="text-center text-xs text-gray-600 mb-1.5">New customer?</div>
                          <Link 
                            href="/auth/register" 
                            className="block px-3 py-2 border border-green-500 text-green-600 rounded text-sm text-center font-semibold hover:bg-green-50 transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Create Account
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Account - Mobile */}
              <Link 
                href={isAuthenticated ? "/profile" : "/auth/login"}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Account"
              >
                <User size={20} className="text-gray-700" />
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
                aria-label="Shopping cart"
              >
                <div className="relative">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
                    <ShoppingCart size={20} className="text-orange-600" />
                  </div>
                  {cartCount > 0 && (
                    <div className="cart-badge">
                      {displayCartCount}
                    </div>
                  )}
                </div>
                <div className="hidden lg:block ml-1.5">
                  <div className="text-xs text-gray-500">Cart</div>
                  <div className="text-xs font-bold text-gray-900">KSh 0.00</div>
                </div>
              </Link>
            </div>
          </div>

          {/* ========== CATEGORIES WITH PRODUCTS DISPLAY ========== */}
          <div className="hidden lg:block py-2 border-t border-gray-100 relative">
            <div className="flex items-center justify-between">
              {/* Left side: Categories */}
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {/* Only "Categories" is a button */}
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className={`category-tab flex items-center space-x-1.5 px-3 py-2 rounded-lg border flex-shrink-0 text-sm ${
                    showAllCategories ? 'active border-green-200 shadow-sm' : 'border-gray-200 hover:border-green-200'
                  }`}
                >
                  <Package size={14} className="text-green-600" />
                  <span className="font-medium text-gray-900">Categories</span>
                  <ChevronDown size={12} className="text-gray-500" />
                </button>

                {/* Categories Scroll - All other categories are Links */}
                <div className="category-scroll">
                  <div className="flex items-center space-x-1.5">
                    {isLoadingCategories ? (
                      <div className="flex space-x-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-9 w-28 bg-gray-200 animate-pulse rounded-lg"></div>
                        ))}
                      </div>
                    ) : (
                      topCategories.map((category) => (
                        <Link
                          key={category.id}
                          href={`/categories/${category.slug}`}
                          onMouseEnter={() => handleCategoryHover(category)}
                          onMouseLeave={handleCategoryLeave}
                          className={`category-tab flex items-center space-x-1.5 px-3 py-2 rounded-lg border flex-shrink-0 text-sm transition-all duration-300 ${
                            activeCategory === category.slug 
                              ? 'active border-green-200 shadow-sm bg-gradient-to-r from-green-50/50 to-orange-50/50' 
                              : 'border-gray-200 hover:border-green-200 hover:bg-gradient-to-r hover:from-green-50/30 hover:to-orange-50/30'
                          }`}
                        >
                          <div className={`${activeCategory === category.slug ? 'text-green-700' : 'text-green-600'}`}>
                            {getCategoryIcon(category.name)}
                          </div>
                          <div className="text-left min-w-0">
                            <div className={`font-medium truncate ${
                              activeCategory === category.slug ? 'text-green-800' : 'text-gray-900'
                            }`}>
                              {category.name}
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Quick Info */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Phone size={14} className="text-green-500 animate-float" />
                  <div>
                    <div className="text-xs text-gray-500">Need help?</div>
                    <div className="text-xs font-bold text-gray-900">+254 716 354589</div>
                  </div>
                </div>
                <Link 
                  href="/track-order"
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-sm hover:shadow text-xs whitespace-nowrap"
                >
                  Track Order
                </Link>
              </div>
            </div>

            {/* All Categories Dropdown */}
            {showAllCategories && (
              <div 
                className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fadeIn dropdown-shadow"
                onMouseLeave={() => setShowAllCategories(false)}
              >
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">All Categories</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {allCategories
                      .filter(cat => cat.parent_id === null)
                      .map((category) => (
                        <Link
                          key={category.id}
                          href={`/categories/${category.slug}`}
                          className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 transition-colors group text-sm"
                          onClick={() => setShowAllCategories(false)}
                        >
                          <div className="text-green-600">
                            {getCategoryIcon(category.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {category.name}
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Category Products Dropdown */}
            {activeCategory && categoryProducts.length > 0 && (
              <div 
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fadeIn dropdown-shadow"
                onMouseEnter={() => {
                  if (categoryHoverTimeoutRef.current) {
                    clearTimeout(categoryHoverTimeoutRef.current);
                  }
                }}
                onMouseLeave={handleCategoryLeave}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Products in {topCategories.find(c => c.slug === activeCategory)?.name}
                      </h3>
                    </div>
                    <Link
                      href={`/categories/${activeCategory}`}
                      className="text-green-600 hover:text-green-700 font-medium text-xs flex items-center space-x-1"
                      onClick={() => {
                        setActiveCategory(null);
                        setCategoryProducts([]);
                      }}
                    >
                      <span>View All</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>

                  <div className="product-grid">
                    {categoryProducts.slice(0, 8).map((product) => {
                      // Custom Product Item Component with Image
                      const ProductItem = ({ product }: { product: Product }) => {
                        const [imageLoaded, setImageLoaded] = useState(false);
                        const [imageError, setImageError] = useState(false);
                        
                        // Get the complete image URL using the helper function
                        const imageUrl = getImageUrl(product);
                        
                        return (
                          <div
                            onClick={() => handleProductClick(product.slug)}
                            className="product-item bg-white rounded border border-gray-200 hover:border-green-200 hover:shadow transition-all duration-300 overflow-hidden group"
                          >
                            {/* Product Image - Using Next.js Image component */}
                            <div className="aspect-square bg-gray-100 overflow-hidden relative">
                              {!imageError ? (
                                <Image
                                  src={imageUrl}
                                  alt={product.name || 'Product image'}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                  className={`object-cover transition-transform duration-500 ${
                                    imageLoaded ? 'group-hover:scale-105 opacity-100' : 'opacity-0'
                                  }`}
                                  onLoad={() => {
                                    console.log(`Product ${product.id}: Image loaded successfully`, imageUrl);
                                    setImageLoaded(true);
                                  }}
                                  onError={(e) => {
                                    console.error(`Product ${product.id}: Failed to load image:`, imageUrl, e);
                                    setImageError(true);
                                    setImageLoaded(true);
                                  }}
                                  loading="lazy"
                                  quality={85}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50">
                                  <ShoppingBasket size={32} className="text-gray-400" />
                                </div>
                              )}
                              {!imageLoaded && !imageError && (
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-2">
                              <h4 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1">
                                {product.name}
                              </h4>
                              
                              {/* Price */}
                              <div className="space-y-0.5">
                                <div className="font-bold text-gray-900">
                                  {formatPrice(Number(product.price))}
                                </div>
                                {product.discounted_price && Number(product.discounted_price) < Number(product.price) && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs text-gray-500 line-through">
                                      {formatPrice(Number(product.price))}
                                    </span>
                                    <span className="px-1 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                                      SAVE {Math.round((1 - Number(product.discounted_price) / Number(product.price)) * 100)}%
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Rating */}
                              {product.rating && Number(product.rating) > 0 && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">{Number(product.rating).toFixed(1)}</span>
                                </div>
                              )}
                              
                              {/* Click to view text */}
                              <div className="text-xs text-green-600 font-medium mt-1 group-hover:text-green-700 transition-colors">
                                View details →
                              </div>
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

        {/* Quick Links Bar - Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-green-50 to-orange-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="overflow-x-auto scrollbar-thin">
              <div className="flex py-1.5 space-x-3 min-w-max">
                {quickLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.id}
                      href={`/${link.id}`}
                      className={`${link.bgColor} ${link.color} px-3 py-2 rounded-lg flex items-center space-x-1.5 min-w-[120px] text-xs`}
                    >
                      <Icon size={14} />
                      <div className="text-left">
                        <div className="font-semibold">{link.name}</div>
                        <div className="opacity-75">{link.desc}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white animate-slideInLeft">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-bold text-gray-900">Search Products</div>
                  <button 
                    onClick={() => setMobileSearchOpen(false)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={20} />
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
                      className="w-full px-3 py-2.5 pl-10 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      autoFocus
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </form>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-3">
                {/* Popular Searches */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Popular Searches</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {quickSearches.slice(0, 9).map((item) => (
                      <button
                        key={item}
                        onClick={() => handleQuickSearch(item)}
                        className="px-3 py-2 bg-gray-50 hover:bg-green-50 text-gray-700 rounded text-xs font-medium transition-colors text-left hover:border-green-200 hover:border"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Categories */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm">Shop by Category</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {topCategories.slice(0, 6).map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="flex items-center p-2 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors text-sm"
                        onClick={() => setMobileSearchOpen(false)}
                      >
                        <div className="text-green-600 mr-2">
                          {getCategoryIcon(category.name)}
                        </div>
                        <span className="font-medium">{category.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl animate-slideInLeft">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-orange-500 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">MH</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">MarketHub</div>
                        <div className="text-xs text-gray-500">Your Fresh Market</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  {/* User Info */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50 to-orange-50 rounded-lg">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {userInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{user?.name}</div>
                        <div className="text-xs text-gray-600 truncate">{user?.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link 
                        href="/auth/login" 
                        className="block py-2 text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold text-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <div className="text-center">
                        <span className="text-xs text-gray-600">New customer? </span>
                        <Link 
                          href="/auth/register" 
                          className="text-green-600 font-semibold hover:underline text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Content */}
                <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
                  <div className="space-y-6">
                    {/* Categories */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center text-sm">
                        <Package size={16} className="mr-2" />
                        Categories
                      </h3>
                      <div className="space-y-1">
                        {topCategories.slice(0, 10).map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group text-sm"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <div className="text-green-600 mr-2">
                                {getCategoryIcon(category.name)}
                              </div>
                              <span className="font-medium text-gray-900">{category.name}</span>
                            </div>
                            <ChevronRight size={14} className="text-gray-400 group-hover:text-green-500" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Services */}
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3 text-sm">Our Services</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {quickLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.id}
                              href={`/${link.id}`}
                              className="p-3 rounded-lg border border-gray-200 hover:border-green-200 hover:shadow transition-all duration-300 text-center text-xs"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <div className={`${link.color} mb-1`}>
                                <Icon size={16} className="mx-auto" />
                              </div>
                              <div className="font-medium">{link.name}</div>
                              <div className="text-gray-500 mt-0.5">{link.desc}</div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <Link 
                      href="/cart" 
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-green-500 to-orange-500 text-white rounded-lg shadow text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <ShoppingCart size={16} className="mr-2" />
                        <div>
                          <div className="font-semibold">View Cart</div>
                          <div className="opacity-90">KSh 0.00</div>
                        </div>
                      </div>
                      {cartCount > 0 && (
                        <span className="bg-white text-green-600 px-2 py-0.5 rounded-full text-xs font-bold">
                          {cartCount} items
                        </span>
                      )}
                    </Link>
                    
                    <div className="text-center text-xs text-gray-600 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-1 mb-1.5">
                        <Phone size={12} className="text-green-500" />
                        <span className="font-medium">Help: +254 716 354589</span>
                      </div>
                      <div className="text-gray-500">
                        © {new Date().getFullYear()} MarketHub
                      </div>
                    </div>
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