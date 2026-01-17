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
  Baby, Droplets, Fish, IceCream, Wheat
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
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const promoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const pathname = usePathname();
  const router = useRouter();

  // Lando Hypermarket Color Scheme
  const colors = useMemo(() => ({
    primary: '#6a9c3d', // greenMedium from your request
    primaryLight: '#9dcc5e', // greenLight as light variant
    primaryDark: '#5a8a2d', // darker variant
    secondary: '#f59e0b', // amber-500
    secondaryLight: '#fbbf24', // amber-400
    secondaryDark: '#d97706', // amber-600
    accent: '#c0392b', // red
    accentLight: '#e67e22', // orange as light variant
    warning: '#f59e0b', // amber-500
    dark: '#1f2937', // gray-800
    light: '#ffffff',
    gray: '#9ca3af', // gray-400
    grayLight: '#f3f4f6' // gray-100
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

  // ========== PRODUCT CALCULATIONS ==========
  const calculateDiscount = useCallback((product: Product) => {
    const price = product.price ? parseFloat(String(product.price)) : 0;
    const finalPrice = product.final_price || product.discounted_price || price;
    const finalPriceNum = finalPrice ? parseFloat(String(finalPrice)) : price;
    
    if (price > 0 && finalPriceNum < price) {
      return Math.round(((price - finalPriceNum) / price) * 100);
    }
    return 0;
  }, []);

  const formatKSH = useCallback((amount: any) => {
    const numAmount = amount ? parseFloat(String(amount)) : 0;
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'KSh 0';
    }
    
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount);
  }, []);

  const getImageUrl = useCallback((product: Product): string => {
    const baseUrl = 'https://api.hypermarket.co.ke';
    const timestamp = product.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    
    let imageUrl = '';
    
    if (product.main_image) {
      imageUrl = product.main_image.startsWith('http') 
        ? product.main_image 
        : `${baseUrl}${product.main_image.startsWith('/') ? '' : '/'}${product.main_image}`;
    } else if (product.thumbnail) {
      let url = product.thumbnail;
      if (!url.startsWith('http')) {
        if (url.startsWith('/storage/')) {
          url = `${baseUrl}${url}`;
        } else if (url.startsWith('storage/')) {
          url = `${baseUrl}/${url}`;
        } else {
          url = `${baseUrl}/storage/${url}`;
        }
      }
      imageUrl = url;
    } else {
      return `https://api.hypermarket.co.ke/storage/default-product.jpg?t=${timestamp}&w=300&h=200&fit=crop&auto=format`;
    }
    
    return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}&w=300&h=200&fit=crop&auto=format`;
  }, []);

  // ========== LANDO HYPERMARKET CATEGORIES ==========
  const categories = useMemo(() => [
    { 
      id: 'fresh-food', 
      name: 'Fresh Food', 
      icon: Apple,
      color: 'bg-green-50 text-green-600 border-green-200',
      subcategories: ['Fruits & Vegetables', 'Meat & Poultry', 'Fish & Seafood', 'Deli & Cheese'] 
    },
    { 
      id: 'bakery', 
      name: 'Bakery', 
      icon: Wheat,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
      subcategories: ['Bread', 'Pastries', 'Cakes', 'Breakfast'] 
    },
    { 
      id: 'dairy-eggs', 
      name: 'Dairy & Eggs', 
      icon: Milk,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      subcategories: ['Milk', 'Cheese', 'Yogurt', 'Butter', 'Eggs'] 
    },
    { 
      id: 'beverages', 
      name: 'Beverages', 
      icon: Coffee,
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      subcategories: ['Water', 'Soft Drinks', 'Juices', 'Tea & Coffee', 'Wine & Beer'] 
    },
    { 
      id: 'frozen', 
      name: 'Frozen', 
      icon: Cloud,
      color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
      subcategories: ['Frozen Vegetables', 'Ice Cream', 'Ready Meals', 'Frozen Snacks'] 
    },
    { 
      id: 'household', 
      name: 'Household', 
      icon: Home,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      subcategories: ['Cleaning', 'Laundry', 'Paper Products', 'Home Care'] 
    },
    { 
      id: 'personal-care', 
      name: 'Personal Care', 
      icon: Droplets,
      color: 'bg-pink-50 text-pink-600 border-pink-200',
      subcategories: ['Skincare', 'Haircare', 'Oral Care', 'Baby Care'] 
    },
    { 
      id: 'promotions', 
      name: 'Promotions', 
      icon: BadgePercent,
      color: 'bg-red-50 text-red-600 border-red-200',
      subcategories: ['Weekly Offers', 'Flash Sales', 'Clearance', 'Buy 1 Get 1'] 
    },
  ], []);

  // Navigation links - Lando Hypermarket style
  const navLinks = useMemo(() => [
    { id: 'home', name: 'Home', href: '/', icon: Home, badge: null },
    { id: 'promotions', name: 'Promotions', href: '/promotions', icon: Tag, badge: 'SALE' },
    { id: 'fresh-market', name: 'Fresh Market', href: '/fresh-market', icon: Carrot, badge: 'FRESH' },
    { id: 'delivery', name: 'Fast Delivery', href: '/delivery', icon: Truck, badge: 'FAST' },
    { id: 'recipes', name: 'Recipes', href: '/recipes', icon: Utensils, badge: null },
  ], []);

  // Mobile menu sections
  const mobileMenuSections = useMemo(() => [
    {
      title: 'Shop by Department',
      items: categories,
      type: 'categories'
    },
    {
      title: 'Lando Services',
      items: [
        { id: 'delivery', name: 'Fast Delivery', icon: Truck, color: 'text-green-600', desc: 'Same Day Delivery' },
        { id: 'quality', name: 'Quality Guarantee', icon: Shield, color: 'text-blue-600', desc: '100% Fresh' },
        { id: 'lando-card', name: 'Lando Card', icon: CreditCard, color: 'text-purple-600', desc: 'Loyalty Program' },
        { id: 'catering', name: 'Catering', icon: ShoppingBasket, color: 'text-amber-600', desc: 'Events & Catering' }
      ],
      type: 'services'
    }
  ], [categories]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    const throttledScroll = debounce(handleScroll, 100);
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
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.touchAction = 'auto';
    };
  }, [mobileMenuOpen, searchOpen]);

  // Focus search input when search opens
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  // Fetch user data and counts
  useEffect(() => {
    const fetchData = async () => {
      if (isLoading) return;
      
      setIsLoading(true);
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
          const count = cartItems.reduce((total: number, item: any) => 
            total + (item.quantity || 1), 0);
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

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setSearchOpen(false);
      setMobileMenuOpen(false);
      router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, router]);

  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchOpen(false);
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

  const userInitial = useMemo(() => 
    user?.name?.charAt(0).toUpperCase() || 'U', [user?.name]
  );

  const userFirstName = useMemo(() => 
    user?.name?.split(' ')[0] || 'User', [user?.name]
  );

  const displayCartCount = useMemo(() => 
    cartCount > 99 ? '99+' : cartCount, [cartCount]
  );

  const isLinkActive = useCallback((href: string) => 
    pathname === href || pathname.startsWith(`${href}/`), [pathname]
  );

  const quickSearches = useMemo(() => [
    'Lando Fresh', 'Promotions', 'Fresh Vegetables', 'Organic', 
    'Bakery', 'Dairy', 'Beverages', 'Frozen Food',
    'Household', 'Personal Care', 'Baby Products', 'Pet Food'
  ], []);

  const closePromoBanner = useCallback(() => {
    setShowPromoBanner(false);
    if (promoIntervalRef.current) {
      clearInterval(promoIntervalRef.current);
    }
  }, []);

  const navigatePromo = useCallback((direction: 'prev' | 'next') => {
    if (promoProducts.length === 0) return;
    
    setCurrentPromoIndex(prev => {
      if (direction === 'next') {
        return (prev + 1) % Math.min(promoProducts.length, 4);
      } else {
        return (prev - 1 + Math.min(promoProducts.length, 4)) % Math.min(promoProducts.length, 4);
      }
    });
    
    if (promoIntervalRef.current) {
      clearInterval(promoIntervalRef.current);
    }
    
    promoIntervalRef.current = setInterval(() => {
      setCurrentPromoIndex(prev => (prev + 1) % Math.min(promoProducts.length, 4));
    }, 5000);
  }, [promoProducts.length]);

  const currentPromoProduct = promoProducts[currentPromoIndex];

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slideInUp { animation: slideInUp 0.3s ease-out; }
        .animate-pulse-slow { animation: pulse 2s infinite; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
        
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: ${colors.accent};
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
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .nav-underline {
          position: relative;
        }
        
        .nav-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 3px;
          background: ${colors.primary};
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        
        .nav-underline:hover::after {
          width: 100%;
        }
        
        .active-nav::after {
          width: 100%;
        }
        
        .lando-header {
          position: sticky;
          top: 0;
          z-index: 50;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          background: ${colors.light};
          border-bottom: 1px solid ${colors.grayLight};
        }
        
        .search-overlay {
          background: ${colors.light};
          backdrop-filter: blur(10px);
        }
        
        .mobile-menu-overlay {
          background: ${colors.light};
          backdrop-filter: blur(10px);
        }
        
        .lando-green-gradient {
          background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%);
        }
        
        .lando-amber-gradient {
          background: linear-gradient(135deg, ${colors.secondary} 0%, ${colors.secondaryLight} 100%);
        }
        
        .category-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .search-suggestion {
          transition: all 0.2s ease;
        }
        
        .search-suggestion:hover {
          background: ${colors.grayLight} !important;
          border-color: ${colors.primary} !important;
        }
        
        .lando-search {
          box-shadow: 0 0 0 1px ${colors.gray}, 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .lando-search:focus-within {
          box-shadow: 0 0 0 2px ${colors.primary}, 0 4px 6px rgba(106,156,61,0.1);
        }
        
        /* Promo banner styles */
        .lando-promo-gradient {
          background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.accentLight} 50%, ${colors.secondary} 100%);
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .text-shadow-sm {
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .price-slash {
          position: relative;
          color: ${colors.gray};
        }
        
        .price-slash::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 1px;
          background: ${colors.accent};
          transform: rotate(-10deg);
        }
        
        .promo-product-slide {
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .promo-dot {
          transition: all 0.3s ease;
        }
        
        .promo-dot.active {
          transform: scale(1.2);
          background: ${colors.light} !important;
        }
        
        .lando-deal-badge {
          background: ${colors.accent};
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .lando-fresh-badge {
          background: ${colors.primary};
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .lando-sale-badge {
          background: linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary} 100%);
          color: white;
          font-size: 11px;
          font-weight: 900;
          padding: 3px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .lando-price {
          color: ${colors.primary};
          font-weight: 800;
        }
        
        .lando-fast-badge {
          background: ${colors.secondary};
          color: white;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>

      {/* Top Information Bar - Lando Green Theme */}
      <div className="hidden lg:block bg-[#6a9c3d] text-white text-sm py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Truck size={14} className="text-[#fbbf24]" />
              <span>Free delivery from KSh 2,500</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield size={14} className="text-[#fbbf24]" />
              <span>100% Quality Guarantee</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={14} className="text-[#fbbf24]" />
              <span>Open 7:00 AM - 10:00 PM</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/store-locator" className="hover:text-[#fbbf24] transition-colors flex items-center space-x-1">
              <Store size={14} />
              <span>Store Locator</span>
            </Link>
            <div className="h-4 w-px bg-white/30"></div>
            <Link href="/help" className="hover:text-[#fbbf24] transition-colors">Help Center</Link>
          </div>
        </div>
      </div>

      {/* Promotional Banner - Lando Hypermarket Style */}
      {showPromoBanner && (
        <div className="relative w-full lando-promo-gradient py-2.5 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {/* Promo Message */}
              <div className="flex items-center space-x-4 flex-1">
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/30 flex items-center space-x-2">
                  <BadgePercent size={14} className="text-white" />
                  <span className="text-white font-bold text-xs uppercase tracking-wider">FLASH SALE</span>
                </div>
                <div className="hidden md:block">
                  <span className="text-white font-bold text-sm tracking-tight">
                    UP TO 50% OFF on selected items! Limited time offer
                  </span>
                </div>
              </div>

              {/* Timer & CTA */}
              <div className="flex items-center space-x-4">
                <div className="hidden lg:flex items-center space-x-2 text-white">
                  <Clock size={14} />
                  <span className="text-sm font-medium">Ends in: 24:59:59</span>
                </div>
                <Link 
                  href="/promotions"
                  className="bg-white text-[#c0392b] font-bold px-4 py-1.5 rounded text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight size={14} />
                </Link>
                <button
                  onClick={closePromoBanner}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close promotional banner"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Header - Lando Hypermarket Style */}
      <div className={`lando-header ${scrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          {/* First Row: Logo, Search, User Actions */}
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center group" aria-label="Lando Hypermarket Home">
                <div className="flex items-center space-x-2">
                  <div className="relative w-12 h-12 md:w-14 md:h-14">
                    {/* Lando Logo */}
                    <Image
                      src="/logo.jpeg"
                      alt="Lando Hypermarket Logo"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 48px, 56px"
                      priority
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-2xl font-black text-[#6a9c3d] tracking-tight">LANDO</div>
                    <div className="text-xs font-medium text-[#666666] -mt-1">HYPERMARKET</div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar - Lando Style */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="lando-search rounded-lg overflow-hidden transition-all duration-200">
                  <div className="relative flex">
                    <input
                      type="search"
                      placeholder="Search for products, brands, or categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3 pl-12 bg-white focus:outline-none text-sm"
                      aria-label="Search products"
                    />
                    <div className="absolute left-4 top-0 bottom-0 flex items-center justify-center pointer-events-none">
                      <Search className="h-5 w-5 text-[#666666]" />
                    </div>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#6a9c3d] text-white hover:bg-[#5a8a2d] transition-colors font-semibold text-sm"
                      disabled={!searchQuery.trim()}
                    >
                      SEARCH
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Side Actions - Lando Style */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search */}
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
              >
                <Search size={20} className="text-gray-700" />
              </button>

              {/* Wishlist - MOVED BEFORE CART */}
              <Link 
                href="/wishlist" 
                className="hidden lg:block relative p-2 hover:bg-gray-50 rounded"
                aria-label="Wishlist"
              >
                <Heart size={20} className="text-gray-700" />
                {wishlistCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </div>
                )}
              </Link>

              {/* Cart - Lando Style */}
              <Link 
                href="/cart" 
                className="relative p-2 hover:bg-gray-50 rounded flex items-center space-x-2"
                aria-label="Shopping cart"
              >
                <div className="relative">
                  <ShoppingCart size={24} className="text-gray-700" />
                  {cartCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-[#c0392b] text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {displayCartCount}
                    </div>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs text-gray-500">My Cart</div>
                  <div className="text-sm font-bold text-gray-900">KSh 0.00</div>
                </div>
              </Link>

              {/* Account - MOVED TO FAR RIGHT AFTER CART */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded transition-colors"
                  aria-label="Account menu"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Hello,</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {isAuthenticated ? userFirstName : 'Sign in'}
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fadeIn">
                    <div className="p-4 border-b">
                      <div className="font-semibold text-gray-900">My Account</div>
                    </div>
                    <div className="p-2">
                      {isAuthenticated ? (
                        <>
                          <Link href="/profile" className="block px-3 py-2 hover:bg-gray-50 rounded text-sm">My Profile</Link>
                          <Link href="/orders" className="block px-3 py-2 hover:bg-gray-50 rounded text-sm">My Orders</Link>
                          <Link href="/wishlist" className="block px-3 py-2 hover:bg-gray-50 rounded text-sm">Wishlist</Link>
                          <button onClick={handleLogout} className="block w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm text-red-600">
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href="/auth/login" className="block px-3 py-2 hover:bg-gray-50 rounded text-sm">Sign In</Link>
                          <Link href="/auth/register" className="block px-3 py-2 hover:bg-gray-50 rounded text-sm">Register</Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                <Menu size={24} className="text-gray-700" />
              </button>
            </div>
          </div>

          {/* Second Row: Categories & Navigation - Lando Style */}
          <div className="hidden lg:flex items-center justify-between py-2 border-t border-gray-100">
            {/* All Categories Button */}
            <div className="relative" ref={categoriesMenuRef}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-[#6a9c3d] text-white hover:bg-[#5a8a2d] rounded-md transition-colors font-medium"
                aria-label="Categories"
              >
                <Menu size={18} />
                <span>ALL CATEGORIES</span>
                <ChevronDown size={16} />
              </button>
              
              {categoriesOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-fadeIn">
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
                            onClick={() => setCategoriesOpen(false)}
                          >
                            <div className={`p-2 rounded-lg ${category.color} mr-3`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{category.name}</div>
                              <div className="text-xs text-gray-500">{category.subcategories.length} departments</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className={`flex items-center space-x-1.5 font-medium text-sm ${
                      isActive ? 'text-[#6a9c3d]' : 'text-gray-700 hover:text-[#6a9c3d]'
                    } transition-colors`}
                  >
                    <Icon size={16} />
                    <span>{link.name}</span>
                    {link.badge && (
                      <span className={`${link.badge === 'SALE' ? 'lando-sale-badge' : link.badge === 'FRESH' ? 'lando-fresh-badge' : 'lando-fast-badge'}`}>
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Store Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Phone size={16} className="text-[#6a9c3d]" />
                <div>
                  <div className="text-gray-500">Need help?</div>
                  <div className="font-bold text-gray-900">+254 716 354589</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {searchOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white">
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <form onSubmit={handleSearch} className="flex-1 mr-4">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search Lando Hypermarket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6a9c3d]"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
              </form>
              <button 
                onClick={() => setSearchOpen(false)}
                className="p-2"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Popular Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleQuickSearch(item)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
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

      {/* Mobile Menu - Now slides from LEFT to RIGHT */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-80 bg-white shadow-xl animate-slideInLeft">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="relative w-10 h-10">
                      <Image
                        src="/logo.jpeg"
                        alt="Lando Hypermarket Logo"
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-[#6a9c3d]">LANDO</div>
                      <div className="text-xs text-gray-500">HYPERMARKET</div>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X size={24} />
                  </button>
                </div>
                
                {isAuthenticated ? (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-[#6a9c3d] flex items-center justify-center text-white font-bold">
                      {userInitial}
                    </div>
                    <div>
                      <div className="font-semibold">{user?.name}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link 
                      href="/auth/login" 
                      className="block w-full py-3 text-center bg-[#6a9c3d] text-white rounded-lg font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/auth/register" 
                      className="block w-full py-3 text-center border border-[#6a9c3d] text-[#6a9c3d] rounded-lg font-semibold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  {/* Categories */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Departments</h3>
                    <div className="space-y-1">
                      {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                          <Link
                            key={category.id}
                            href={`/categories/${category.id}`}
                            className="flex items-center p-3 hover:bg-gray-50 rounded-lg"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon size={20} className="mr-3 text-gray-600" />
                            <span className="font-medium">{category.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Quick Links</h3>
                    <div className="space-y-1">
                      {navLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.id}
                            href={link.href}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center">
                              <Icon size={18} className="mr-3 text-gray-600" />
                              <span>{link.name}</span>
                            </div>
                            {link.badge && (
                              <span className={`text-xs px-2 py-1 rounded ${link.badge === 'SALE' ? 'bg-red-100 text-red-700' : link.badge === 'FRESH' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {link.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Services</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {mobileMenuSections[1].items.map((service) => {
                        const Icon = service.icon;
                        return (
                          <Link
                            key={service.id}
                            href={`/${service.id}`}
                            className="p-3 bg-gray-50 rounded-lg text-center"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon size={20} className={`mx-auto mb-2 ${service.color}`} />
                            <div className="font-medium text-sm">{service.name}</div>
                            <div className="text-xs text-gray-500">{service.desc}</div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t">
                <div className="space-y-3">
                  <Link href="/cart" className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <ShoppingCart size={20} className="mr-3" />
                      <span className="font-medium">My Cart</span>
                    </div>
                    {cartCount > 0 && (
                      <span className="bg-[#c0392b] text-white text-xs px-2 py-1 rounded-full">
                        {cartCount} items
                      </span>
                    )}
                  </Link>
                  <div className="text-center text-sm text-gray-500">
                    Need help? Call +254 716 354589
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;