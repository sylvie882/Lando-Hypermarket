'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  ShoppingCart, User, Search, Menu, X, Heart, Truck, 
  Phone, LogIn, ChevronDown, MapPin, Clock,
  Package, Star, Home, ChevronRight, Headphones, Tag,
  ShoppingBag, Gift, Shield, CreditCard, HelpCircle,
  Navigation, PhoneCall, Zap, ChevronLeft, ArrowRight, Percent,
  Store, ShoppingBasket, Coffee, Apple, Carrot, Beef,
  Milk, Wine, Sparkles, BadgePercent,
  Cloud, Pizza, Egg, Cookie, Utensils, Leaf,
  Baby, Droplets, Fish, IceCream, Wheat,
  ShoppingBasket as Basket,
  Package as PackageIcon,
  Truck as TruckIcon,
  MapPin as LocationIcon,
  Smartphone,
  Globe,
  Award,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Product } from '@/types';

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
  const [showPromoBanner, setShowPromoBanner] = useState(true);
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [isPromoLoading, setIsPromoLoading] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const promoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Enhanced Categories with Subcategories
  const categories = useMemo(() => [
    { 
      id: 'fresh-food', 
      name: 'Fresh Food', 
      icon: Apple,
      color: 'bg-green-50 text-green-600',
      bgColor: 'bg-green-500',
      subcategories: [
        { name: 'Fruits & Vegetables', icon: Apple },
        { name: 'Meat & Poultry', icon: Beef },
        { name: 'Fish & Seafood', icon: Fish },
        { name: 'Dairy & Eggs', icon: Milk }
      ],
      featured: true
    },
    { 
      id: 'bakery', 
      name: 'Bakery', 
      icon: Wheat,
      color: 'bg-amber-50 text-amber-600',
      bgColor: 'bg-amber-500',
      subcategories: [
        { name: 'Bread', icon: Wheat },
        { name: 'Cakes & Pastries', icon: Cookie },
        { name: 'Breakfast', icon: Coffee }
      ],
      featured: true
    },
    { 
      id: 'beverages', 
      name: 'Beverages', 
      icon: Coffee,
      color: 'bg-orange-50 text-orange-600',
      bgColor: 'bg-orange-500',
      subcategories: [
        { name: 'Water & Soft Drinks', icon: Droplets },
        { name: 'Juices', icon: Apple },
        { name: 'Coffee & Tea', icon: Coffee }
      ],
      featured: false
    },
    { 
      id: 'frozen', 
      name: 'Frozen Foods', 
      icon: Cloud,
      color: 'bg-cyan-50 text-cyan-600',
      bgColor: 'bg-cyan-500',
      subcategories: [
        { name: 'Frozen Vegetables', icon: Carrot },
        { name: 'Ice Cream', icon: IceCream },
        { name: 'Ready Meals', icon: Pizza }
      ],
      featured: false
    },
    { 
      id: 'household', 
      name: 'Household', 
      icon: Home,
      color: 'bg-purple-50 text-purple-600',
      bgColor: 'bg-purple-500',
      subcategories: [
        { name: 'Cleaning', icon: Sparkles },
        { name: 'Laundry', icon: RefreshCw },
        { name: 'Home Care', icon: Home }
      ],
      featured: false
    },
    { 
      id: 'personal-care', 
      name: 'Personal Care', 
      icon: Droplets,
      color: 'bg-pink-50 text-pink-600',
      bgColor: 'bg-pink-500',
      subcategories: [
        { name: 'Skincare', icon: Droplets },
        { name: 'Haircare', icon: Baby },
        { name: 'Baby Care', icon: Baby }
      ],
      featured: false
    },
    { 
      id: 'promotions', 
      name: 'Promotions', 
      icon: Tag,
      color: 'bg-red-50 text-red-600',
      bgColor: 'bg-red-500',
      subcategories: [
        { name: 'Weekly Offers', icon: Tag },
        { name: 'Flash Sales', icon: Zap },
        { name: 'Clearance', icon: Percent }
      ],
      featured: true
    },
    { 
      id: 'electronics', 
      name: 'Electronics', 
      icon: Smartphone,
      color: 'bg-blue-50 text-blue-600',
      bgColor: 'bg-blue-500',
      subcategories: [
        { name: 'Smartphones', icon: Smartphone },
        { name: 'Accessories', icon: Headphones },
        { name: 'Home Appliances', icon: Home }
      ],
      featured: false
    },
  ], []);

  // Quick Links with Icons
  const quickLinks = useMemo(() => [
    { 
      id: 'delivery', 
      name: 'Fast Delivery', 
      icon: TruckIcon,
      desc: '1-2 Hour Delivery',
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      id: 'pickup', 
      name: 'Store Pickup', 
      icon: PackageIcon,
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

  // Navigation Menu Items
  const navItems = useMemo(() => [
    { id: 'home', name: 'Home', href: '/', featured: false },
    { id: 'shop', name: 'Shop', href: '/products', featured: true },
    { id: 'deals', name: 'Deals', href: '/deals', featured: true },
    { id: 'new', name: 'New Arrivals', href: '/new', featured: true },
    { id: 'recipes', name: 'Recipes', href: '/recipes', featured: false },
    { id: 'stores', name: 'Stores', href: '/stores', featured: false },
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

  const closePromoBanner = useCallback(() => {
    setShowPromoBanner(false);
    if (promoIntervalRef.current) {
      clearInterval(promoIntervalRef.current);
    }
  }, []);

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
          50% { transform: translateY(-5px); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slideInLeft { animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-pulse-slow { animation: pulse 2s infinite; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        
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
        
        .header-gradient {
          background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
        }
        
        .promo-gradient {
          background: linear-gradient(135deg, #f97316 0%, #fb923c 50%, #f59e0b 100%);
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .search-glow {
          box-shadow: 0 0 0 1px #e5e7eb, 0 4px 12px rgba(34, 197, 94, 0.1);
        }
        
        .search-glow:focus-within {
          box-shadow: 0 0 0 2px #22c55e, 0 6px 20px rgba(34, 197, 94, 0.15);
        }
        
        .nav-link {
          position: relative;
          padding-bottom: 4px;
        }
        
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #22c55e 0%, #f97316 100%);
          transition: width 0.3s ease;
          border-radius: 1px;
        }
        
        .nav-link:hover::after,
        .nav-link.active::after {
          width: 100%;
        }
        
        .category-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }
        
        .quick-link-card {
          transition: all 0.3s ease;
        }
        
        .quick-link-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
        }
        
        .mobile-menu-bg {
          background: linear-gradient(135deg, #f9fafb 0%, #f0fdf4 100%);
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #22c55e 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
      `}</style>

      {/* Top Information Bar */}
      <div className="hidden lg:block bg-gradient-to-r from-green-50 to-orange-50 border-b border-gray-200 py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ShieldCheck size={14} className="text-green-500" />
              <span>100% Quality Guaranteed</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Truck size={14} className="text-orange-500" />
              <span>Free Delivery on orders over KSh 2,500</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Globe size={14} className="text-blue-500" />
              <span>Delivery across Kenya</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/stores" className="text-sm text-gray-600 hover:text-green-600 transition-colors flex items-center space-x-1">
              <Store size={14} />
              <span>Store Locator</span>
            </Link>
            <div className="h-4 w-px bg-gray-300"></div>
            <Link href="/help" className="text-sm text-gray-600 hover:text-green-600 transition-colors">Help Center</Link>
            <div className="h-4 w-px bg-gray-300"></div>
            <select className="text-sm text-gray-600 bg-transparent focus:outline-none">
              <option>KES - KSh</option>
              <option>USD - $</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      {showPromoBanner && (
        <div className="promo-gradient text-white py-2.5 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full flex items-center space-x-2 animate-pulse-slow">
                  <Zap size={16} className="text-yellow-300" />
                  <span className="font-bold text-sm tracking-wide">FLASH SALE</span>
                </div>
                <div className="text-sm sm:text-base font-medium">
                  🎉 UP TO 50% OFF on Fresh Produce & More! Limited time offer
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
                  <Clock size={14} />
                  <span className="text-sm font-medium">Ends: 24:59:59</span>
                </div>
                <Link 
                  href="/promotions"
                  className="bg-white text-orange-600 font-bold px-5 py-2 rounded-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 shadow-lg"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight size={16} />
                </Link>
                <button
                  onClick={closePromoBanner}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close promotional banner"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'shadow-xl' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* First Row: Logo, Search, Actions */}
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu size={24} className="text-gray-700" />
              </button>

              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative w-12 h-12">
                  {/* Replace with your logo */}
                 <div className="flex items-center justify-center w-12 h-12 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <img 
                    src="/logo.jpeg" 
                    alt="Lando Ranch Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-2xl font-black text-gray-900 tracking-tight">
                    Lando
                  </div>
                  <div className="text-xs font-medium text-green-500 -mt-1">Hypermarket</div>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="search-glow rounded-xl overflow-hidden transition-all duration-300">
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center justify-center pointer-events-none">
                      <Search size={20} className="text-gray-400" />
                    </div>
                    <input
                      type="search"
                      placeholder="Search for fresh produce, groceries, and more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3 pl-12 bg-gray-50 focus:outline-none text-gray-900 placeholder-gray-500"
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold text-sm flex items-center space-x-2"
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
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Mobile Search */}
              <button 
                className="lg:hidden p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search"
              >
                <Search size={22} className="text-gray-700" />
              </button>

              {/* Wishlist */}
              <Link 
                href="/wishlist" 
                className="hidden lg:flex relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors group"
                aria-label="Wishlist"
              >
                <Heart size={22} className="text-gray-700 group-hover:text-red-500 transition-colors" />
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
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Account menu"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                    {isAuthenticated ? userInitial : <User size={18} />}
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-xs text-gray-500">Welcome back!</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {isAuthenticated ? userFirstName : 'Sign In'}
                    </div>
                  </div>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 animate-fadeIn dropdown-shadow overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-orange-50 border-b">
                      <div className="font-semibold text-gray-900">My Account</div>
                      {isAuthenticated && user?.email && (
                        <div className="text-sm text-gray-600 mt-1 truncate">{user.email}</div>
                      )}
                    </div>
                    <div className="p-2">
                      {isAuthenticated ? (
                        <>
                          <Link 
                            href="/orders" 
                            className="flex items-center px-4 py-3 hover:bg-gray-50 rounded-lg text-sm transition-colors group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package size={18} className="mr-3 text-gray-500 group-hover:text-green-500" />
                            <div>
                              <div className="font-medium">My Orders</div>
                              <div className="text-xs text-gray-500">Track & manage orders</div>
                            </div>
                          </Link>
                          <Link 
                            href="/wishlist" 
                            className="flex items-center px-4 py-3 hover:bg-gray-50 rounded-lg text-sm transition-colors group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Heart size={18} className="mr-3 text-gray-500 group-hover:text-red-500" />
                            <div>
                              <div className="font-medium">Wishlist</div>
                              <div className="text-xs text-gray-500">Saved items</div>
                            </div>
                          </Link>
                          <Link 
                            href="/profile" 
                            className="flex items-center px-4 py-3 hover:bg-gray-50 rounded-lg text-sm transition-colors group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={18} className="mr-3 text-gray-500 group-hover:text-blue-500" />
                            <div>
                              <div className="font-medium">Profile</div>
                              <div className="text-xs text-gray-500">Account settings</div>
                            </div>
                          </Link>
                          <div className="border-t my-2"></div>
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
                          >
                            <span>Sign Out</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <Link 
                            href="/auth/login" 
                            className="block px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-sm text-center font-semibold mb-2 hover:from-green-600 hover:to-green-700 transition-all duration-300"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Sign In
                          </Link>
                          <div className="text-center text-sm text-gray-600 mb-3">New to MarketHub?</div>
                          <Link 
                            href="/auth/register" 
                            className="block px-4 py-3 border-2 border-green-500 text-green-600 rounded-lg text-sm text-center font-semibold hover:bg-green-50 transition-colors"
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
                className="lg:hidden p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Account"
              >
                <User size={22} className="text-gray-700" />
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative p-2.5 hover:bg-gray-100 rounded-lg transition-colors group"
                aria-label="Shopping cart"
              >
                <div className="relative">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
                    <ShoppingCart size={24} className="text-orange-600" />
                  </div>
                  {cartCount > 0 && (
                    <div className="cart-badge">
                      {displayCartCount}
                    </div>
                  )}
                </div>
                <div className="hidden lg:block ml-2">
                  <div className="text-xs text-gray-500">Your Cart</div>
                  <div className="text-sm font-bold text-gray-900">KSh 0.00</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Second Row: Navigation & Categories */}
          <div className="hidden lg:flex items-center justify-between py-3 border-t border-gray-100">
            {/* All Categories Button */}
            <div className="relative" ref={categoriesMenuRef}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                onMouseEnter={() => setCategoriesOpen(true)}
                className="flex items-center space-x-3 px-5 py-3.5 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
                aria-label="Browse categories"
              >
                <Menu size={20} />
                <span>BROWSE CATEGORIES</span>
                <ChevronDown size={18} className="ml-2" />
              </button>
              
              {categoriesOpen && (
                <div 
                  className="absolute top-full left-0 mt-2 w-[800px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 animate-fadeIn dropdown-shadow"
                  onMouseLeave={() => setCategoriesOpen(false)}
                >
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Popular Categories</h3>
                        {categories.filter(cat => cat.featured).map((category) => {
                          const Icon = category.icon;
                          return (
                            <Link
                              key={category.id}
                              href={`/categories/${category.id}`}
                              className="flex items-center p-4 hover:bg-gray-50 rounded-xl transition-all duration-300 category-card"
                              onClick={() => setCategoriesOpen(false)}
                              onMouseEnter={() => setActiveCategory(category.id)}
                            >
                              <div className={`p-3 rounded-lg ${category.color} mr-4`}>
                                <Icon size={20} />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{category.name}</div>
                                <div className="text-sm text-gray-500 mt-1">
                                  {category.subcategories.slice(0, 2).map(sc => sc.name).join(', ')}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">All Departments</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                              <Link
                                key={category.id}
                                href={`/categories/${category.id}`}
                                className={`flex items-center p-3 rounded-lg transition-colors ${activeCategory === category.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                                onClick={() => setCategoriesOpen(false)}
                                onMouseEnter={() => setActiveCategory(category.id)}
                              >
                                <div className={`p-2 rounded-md ${category.color} mr-3`}>
                                  <Icon size={16} />
                                </div>
                                <span className="text-sm font-medium">{category.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`nav-link font-medium text-gray-700 hover:text-green-600 transition-colors ${isActive(item.href) ? 'active text-green-600' : ''}`}
                >
                  {item.featured && (
                    <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded">
                      HOT
                    </span>
                  )}
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Quick Info */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Phone size={20} className="text-green-500 animate-float" />
                <div>
                  <div className="text-xs text-gray-500">Need help?</div>
                  <div className="text-sm font-bold text-gray-900">+254 716 354589</div>
                </div>
              </div>
              <Link 
                href="/track-order"
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Track Order
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Links Bar - Mobile */}
        <div className="lg:hidden bg-gradient-to-r from-green-50 to-orange-50 border-t border-gray-200">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="flex px-4 py-2 space-x-4 min-w-max">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.id}
                    href={`/${link.id}`}
                    className={`${link.bgColor} ${link.color} px-4 py-3 rounded-xl quick-link-card flex items-center space-x-2 min-w-[140px]`}
                  >
                    <Icon size={18} />
                    <div className="text-left">
                      <div className="text-sm font-semibold">{link.name}</div>
                      <div className="text-xs opacity-75">{link.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {mobileSearchOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white animate-slideInLeft">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-bold text-gray-900">Search Products</div>
                  <button 
                    onClick={() => setMobileSearchOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="What are you looking for today?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 pl-12 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                  </div>
                </form>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {/* Popular Searches */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Popular Searches</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {quickSearches.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleQuickSearch(item)}
                        className="px-4 py-3 bg-gray-50 hover:bg-green-50 text-gray-700 rounded-lg text-sm font-medium transition-colors text-left hover:border-green-200 hover:border"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Categories */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-lg">Shop by Category</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.slice(0, 6).map((category) => {
                      const Icon = category.icon;
                      return (
                        <Link
                          key={category.id}
                          href={`/categories/${category.id}`}
                          className="flex items-center p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors"
                          onClick={() => setMobileSearchOpen(false)}
                        >
                          <div className={`p-2 rounded-lg ${category.color} mr-3`}>
                            <Icon size={18} />
                          </div>
                          <span className="font-medium text-sm">{category.name}</span>
                        </Link>
                      );
                    })}
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
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm mobile-menu-bg shadow-2xl animate-slideInLeft">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">MH</span>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-lg">MarketHub</div>
                        <div className="text-xs text-gray-500">Your Fresh Market</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  
                  {/* User Info */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-orange-50 rounded-xl">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                        {userInitial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{user?.name}</div>
                        <div className="text-sm text-gray-600 truncate">{user?.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link 
                        href="/auth/login" 
                        className="block py-3 text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold shadow-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <div className="text-center">
                        <span className="text-sm text-gray-600">New customer? </span>
                        <Link 
                          href="/auth/register" 
                          className="text-green-600 font-semibold hover:underline"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menu Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  <div className="space-y-8">
                    {/* Categories */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                        <Menu size={20} className="mr-2" />
                        Categories
                      </h3>
                      <div className="space-y-2">
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <Link
                              key={category.id}
                              href={`/categories/${category.id}`}
                              className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <div className="flex items-center">
                                <div className={`p-2 rounded-lg ${category.color} mr-3`}>
                                  <Icon size={18} />
                                </div>
                                <span className="font-medium text-gray-900">{category.name}</span>
                              </div>
                              <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-4">Quick Links</h3>
                      <div className="space-y-2">
                        {navItems.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className="font-medium text-gray-900">{item.name}</span>
                            {item.featured && (
                              <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold rounded">
                                HOT
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Services */}
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg mb-4">Our Services</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {quickLinks.map((link) => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.id}
                              href={`/${link.id}`}
                              className="p-4 rounded-xl border border-gray-200 hover:border-green-200 hover:shadow-md transition-all duration-300 text-center"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <div className={`${link.color} mb-2`}>
                                <Icon size={20} className="mx-auto" />
                              </div>
                              <div className="font-medium text-sm">{link.name}</div>
                              <div className="text-xs text-gray-500 mt-1">{link.desc}</div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <Link 
                      href="/cart" 
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-orange-500 text-white rounded-xl shadow-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        <ShoppingCart size={20} className="mr-3" />
                        <div>
                          <div className="font-semibold">View Cart</div>
                          <div className="text-sm opacity-90">KSh 0.00</div>
                        </div>
                      </div>
                      {cartCount > 0 && (
                        <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                          {cartCount} items
                        </span>
                      )}
                    </Link>
                    
                    <div className="text-center text-sm text-gray-600 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Phone size={16} className="text-green-500" />
                        <span className="font-medium">Need help? Call +254 716 354589</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        © {new Date().getFullYear()} MarketHub. All rights reserved.
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