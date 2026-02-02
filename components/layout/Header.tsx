'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  ShoppingCart, User, Search, Menu, X, Heart, 
  ChevronDown, ArrowRight, ChevronRight,
  Package, ShoppingBag, MapPin, Phone, ShieldCheck,
  Zap, Sparkles, Flame, Star, Clock, MapPin as MapPinIcon, Truck
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { debounce } from 'lodash';
import { Product, Category } from '@/types';
import DeliveryModeToggle from '../DeliveryModeToggle';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isHoveringCategory, setIsHoveringCategory] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState('6:00 PM');
  const [deliveryLocation, setDeliveryLocation] = useState('Westlands - Nairobi');
  
  // Refs
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const categoryHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  
  const pathname = usePathname();
  const router = useRouter();

  // Fetch categories
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

  // Fetch products for category
  const fetchProductsForCategory = useCallback(async (categoryId: string | number) => {
    try {
      const response = await api.products.getAll({ 
        category_id: categoryId,
        per_page: 8,
        sort: 'created_at',
        order: 'desc'
      });
      const products = response.data?.data || response.data || [];
      setCategoryProducts(products);
    } catch (error) {
      console.error('Failed to fetch category products:', error);
    }
  }, []);

  // Get top categories for horizontal display
  const topCategories = useMemo(() => {
    return allCategories
      .filter(cat => (cat.active_products_count || 0) > 0 && cat.parent_id === null)
      .sort((a, b) => (b.active_products_count || 0) - (a.active_products_count || 0))
      .slice(0, 11);
  }, [allCategories]);

  // Handle category hover with delay
  const handleCategoryHover = useCallback((category: Category) => {
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }

    setIsHoveringCategory(true);
    
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

    setIsHoveringCategory(false);
    
    categoryHoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setCategoryProducts([]);
    }, 300);
  }, []);

  // Handle mouse move in dropdown
  const handleDropdownMouseEnter = useCallback(() => {
    setIsHoveringCategory(true);
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }
  }, []);

  const handleDropdownMouseLeave = useCallback(() => {
    setIsHoveringCategory(false);
    if (categoryHoverTimeoutRef.current) {
      clearTimeout(categoryHoverTimeoutRef.current);
    }
    
    categoryHoverTimeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
      setCategoryProducts([]);
    }, 300);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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
        setShowAllCategories(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
        setCategoryProducts([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle body overflow
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

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
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
      }
    };

    fetchData();
  }, [isAuthenticated, authLoading]);

  // Event Handlers
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
      router.push(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, router]);

  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
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
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Check active link
  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === href;
    return pathname.startsWith(href);
  }, [pathname]);

  // User info
  const userFirstName = useMemo(() => 
    user?.name?.split(' ')[0] || 'Guest', [user?.name]
  );

  const displayCartCount = useMemo(() => 
    cartCount > 99 ? '99+' : cartCount, [cartCount]
  );

  // Quick searches
  const quickSearches = useMemo(() => [
    'Fresh Vegetables', 'Organic Fruits', 'Dairy Products', 'Bakery Items',
    'Coffee & Tea', 'Snacks', 'Cleaning Supplies', 'Personal Care'
  ], []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (categoryHoverTimeoutRef.current) {
        clearTimeout(categoryHoverTimeoutRef.current);
      }
    };
  }, []);

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(price);
  };

  // Get image URL helper
  const getImageUrl = (product: Product) => {
    if (!product) return '/images/placeholder.jpg';
    
    const imageUrl = product.main_image || product.thumbnail || product.gallery?.[0] || product.images?.[0];
    
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
    
    return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.hypermarket.co.ke'}/storage/${cleanPath}`;
  };

  // Handle product click
  const handleProductClick = (productSlug: string) => {
    setActiveCategory(null);
    setCategoryProducts([]);
    router.push(`/products/${productSlug}`);
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        
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
        }
        
        .dropdown-shadow {
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(20px);
        }
        
        /* 90EE90 specific styles */
        .primary-green {
          background-color: #90EE90;
        }
        
        .primary-green-gradient {
          background: linear-gradient(135deg, #90EE90 0%, #7CD47C 100%);
        }
        
        .primary-green-dark {
          background-color: #76D176;
        }
        
        .primary-green-text {
          color: #2E8B57;
        }
        
        .primary-green-border {
          border-color: #90EE90;
        }
        
        .primary-green-hover:hover {
          background-color: #7CD47C;
        }
        
        .delivery-info {
          background: linear-gradient(135deg, #90EE90 0%, #7CD47C 100%);
          color: #2E8B57;
        }
        
        .free-delivery-badge {
          background: linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%);
          color: white;
        }
        
        .category-tag {
          background: #F8F9FA;
          border: 1px solid #E9ECEF;
          transition: all 0.2s ease;
        }
        
        .category-tag:hover {
          background: #90EE90;
          border-color: #76D176;
          transform: translateY(-1px);
        }
        
        /* Navigation Links Row */
        .nav-links-row {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-left: 2rem;
        }
        
        .nav-link {
          font-size: 14px;
          font-weight: 600;
          color: #4b5563;
          text-decoration: none;
          padding: 0.5rem 0;
          position: relative;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .nav-link:hover {
          color: #2E8B57;
        }
        
        .nav-link.active {
          color: #2E8B57;
          font-weight: 700;
        }
        
        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #90EE90, #76D176);
          border-radius: 1px;
        }
        
        /* Horizontal Categories Row - Enhanced */
        .categories-row-container {
          width: 100%;
          background: white;
          border-top: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
        }
        
        .categories-row-inner {
          max-width: 7xl;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .all-categories-button {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, #90EE90, #76D176);
          color: #2E8B57;
          border-radius: 8px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .all-categories-button:hover {
          background: linear-gradient(135deg, #7CD47C, #68C168);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(144, 238, 144, 0.3);
        }
        
        .categories-row-scroll {
          display: flex;
          overflow-x: auto;
          padding: 0.75rem 0;
          gap: 1.5rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          flex: 1;
        }
        
        .categories-row-scroll::-webkit-scrollbar {
          display: none;
        }
        
        .category-link {
          flex: 0 0 auto;
          color: #4b5563;
          text-decoration: none;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          padding: 0.25rem 0;
          position: relative;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .category-link:hover {
          color: #2E8B57;
        }
        
        .category-link.active {
          color: #2E8B57;
          font-weight: 700;
        }
        
        .category-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #90EE90, #76D176);
          border-radius: 1px;
        }
        
        /* Category Dropdown */
        .category-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          z-index: 40;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          animation: fadeIn 0.2s ease-out;
          overflow: hidden;
        }
        
        .category-dropdown-content {
          max-width: 7xl;
          margin: 0 auto;
          padding: 2rem 1rem;
        }
        
        .category-products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        
        .category-product-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .category-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-color: #90EE90;
        }
        
        .product-image-container {
          position: relative;
          aspect-ratio: 1/1;
          background: #f8fafc;
          overflow: hidden;
        }
        
        .product-image {
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .category-product-card:hover .product-image {
          transform: scale(1.05);
        }
        
        .product-info {
          padding: 1rem;
        }
        
        .product-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .product-price {
          font-size: 16px;
          font-weight: 700;
          color: #2E8B57;
        }
        
        /* Mobile specific */
        @media (max-width: 1023px) {
          .nav-links-row {
            display: none;
          }
          
          .categories-row-inner {
            padding: 0 1rem;
            flex-direction: row;
            gap: 1rem;
          }
          
          .all-categories-button {
            padding: 0.5rem 0.75rem;
            font-size: 13px;
          }
          
          .categories-row-scroll {
            gap: 1rem;
            padding: 0.5rem 0;
          }
          
          .category-link {
            font-size: 13px;
            padding: 0.25rem 0;
          }
          
          .category-dropdown-content {
            padding: 1.5rem 1rem;
          }
          
          .category-products-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }
        }
        
        /* Tablet specific */
        @media (min-width: 769px) and (max-width: 1023px) {
          .category-products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* Desktop specific */
        @media (min-width: 1024px) {
          .categories-row-container {
            border-top: none;
          }
          
          .categories-row-inner {
            padding: 0;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .categories-row-scroll {
            padding: 0.75rem 0;
          }
          
          .category-dropdown-content {
            padding: 2rem 0;
            max-width: 1200px;
          }
        }
        
        /* Mobile menu categories */
        .mobile-categories-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-top: 1rem;
        }
        
        .mobile-category-item {
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
          text-decoration: none;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s ease;
          border: 1px solid #e5e7eb;
        }
        
        .mobile-category-item:hover {
          background: #90EE90;
          color: #2E8B57;
          transform: translateY(-2px);
          border-color: #76D176;
        }
      `}</style>
      {/* Main Header */}
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${scrolled ? 'header-shadow' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-0">
          {/* First Row: Logo, Navigation Links, Search, Actions */}
          <div className="flex items-center justify-between py-3">
            {/* Logo and Navigation Links */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <button 
                  className="lg:hidden p-2 rounded-xl bg-white hover:bg-gray-50 shadow-sm transition-all duration-300"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu size={22} className="text-gray-800" />
                </button>

                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-500 border-4 border-white">
                    <Image 
                      src="/logoone.jpeg" 
                      alt="Carrefour Logo" 
                      fill
                      className="object-cover"
                      sizes="48px"
                      priority
                    />
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-2xl font-black text-[#2E8B57] tracking-tight">
                      Lando
                    </div>
                    <div className="text-xs font-bold text-gray-600 -mt-1 tracking-wider">Hypermarket</div>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation Links - After Logo */}
              <div className="hidden lg:block nav-links-row">
                <Link
                  href="/"
                  className={`nav-link ${isActive('/') ? 'active' : ''}`}
                >
                  Home
                </Link>
                <Link
                  href="/products"
                  className={`nav-link ${isActive('/products') ? 'active' : ''}`}
                >
                  Shop All
                </Link>
                <Link
                  href="/deals"
                  className={`nav-link ${isActive('/deals') ? 'active' : ''}`}
                >
                  Hot Deals
                </Link>
                <Link
                  href="#new-arrivals"
                  className={`nav-link ${isActive('/new-arrivals') ? 'active' : ''}`}
                >
                  New Arrivals
                </Link>
              </div>
            </div>

            {/* Desktop Search Bar - Centered */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-6">
              <form onSubmit={handleSearch} className="relative w-full">
                <div className="rounded-2xl overflow-hidden transition-all duration-500 border-2 border-gray-200 focus-within:border-[#90EE90] focus-within:shadow-lg">
                  <div className="relative flex items-center">
                    <div className="absolute left-4 flex items-center justify-center pointer-events-none">
                      <Search size={20} className="text-[#76D176]" />
                    </div>
                    <input
                      type="search"
                      placeholder="Discover amazing products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-5 py-3 pl-12 bg-white focus:outline-none text-gray-900 placeholder-gray-500 text-sm placeholder:font-medium"
                      aria-label="Search products"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57] hover:from-[#7CD47C] hover:to-[#68C168] transition-all duration-300 font-bold text-sm flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!searchQuery.trim()}
                    >
                      <Search size={18} className="text-[#2E8B57]" />
                      <span className="text-[#2E8B57]">SEARCH</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search */}
              <button 
                className="lg:hidden p-2 rounded-xl bg-white hover:bg-gray-50 shadow-sm transition-colors"
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
                <div className="relative p-2 rounded-xl bg-white border border-gray-200 group-hover:border-red-300 transition-colors">
                  <Heart size={20} className="text-red-500 group-hover:text-red-600 transition-colors" />
                </div>
              </Link>

              {/* User Account - Desktop */}
              <div className="hidden lg:block relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1 hover:scale-105 transition-all duration-300 group"
                  aria-label="Account menu"
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-2xl overflow-hidden border-2 border-white shadow-lg group-hover:shadow-xl transition-shadow">
                      {user?.profile_picture_url ? (
                        <Image
                          src={user.profile_picture_url}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#90EE90] via-[#7CD47C] to-[#76D176] flex items-center justify-center">
                          <User size={20} className="text-white" />
                        </div>
                      )}
                    </div>
                    {isAuthenticated && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#76D176] rounded-full border-2 border-white shadow"></div>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Welcome back!</div>
                    <div className="text-sm font-bold text-gray-900 flex items-center">
                      {isAuthenticated ? userFirstName : 'Sign In'}
                      <ChevronDown size={14} className="ml-1.5 text-gray-500 group-hover:text-[#76D176]" />
                    </div>
                  </div>
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl z-50 animate-fadeIn dropdown-shadow overflow-hidden border border-gray-200">
                    <div className="p-4 bg-white border-b border-gray-100">
                      <div className="font-bold text-gray-900 text-lg">My Account</div>
                      {isAuthenticated && user?.email && (
                        <div className="text-sm text-gray-600 mt-1 truncate">{user.email}</div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      {isAuthenticated ? (
                        <>
                          <div className="grid grid-cols-2 gap-3 p-2">
                            <Link 
                              href="/orders" 
                              className="flex flex-col items-center p-3 hover:bg-[#F0FFF0] rounded-xl transition-colors group border border-gray-100 hover:border-[#90EE90]"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-[#F0FFF0] mb-2">
                                <ShoppingBag size={18} className="text-[#2E8B57]" />
                              </div>
                              <div className="font-semibold text-sm text-[#2E8B57]">Orders</div>
                            </Link>
                            <Link 
                              href="/profile/wishlist" 
                              className="flex flex-col items-center p-3 hover:bg-red-50 rounded-xl transition-colors group border border-gray-100 hover:border-red-200"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <div className="p-2 rounded-lg bg-red-50 mb-2">
                                <Heart size={18} className="text-red-600" />
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
                              <User size={16} className="mr-3 text-gray-500 group-hover:text-[#76D176]" />
                              <span className="font-semibold">My Profile</span>
                            </Link>
                            <Link 
                              href="/addresses" 
                              className="flex items-center px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm transition-colors group"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <MapPin size={16} className="mr-3 text-gray-500 group-hover:text-[#76D176]" />
                              <span className="font-semibold">Addresses</span>
                            </Link>
                          </div>
                          
                          <div className="border-t border-gray-100 my-3"></div>
                          
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-3 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 rounded-xl text-sm font-bold transition-all duration-300 shadow hover:shadow-lg mt-1"
                          >
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-3 space-y-4">
                            <Link 
                              href="/auth/login" 
                              className="block px-3 py-3 bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57] rounded-xl text-sm font-bold text-center hover:from-[#7CD47C] hover:to-[#68C168] transition-all duration-300 shadow-lg hover:shadow-xl"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              Sign In to Your Account
                            </Link>
                            <div className="text-center text-sm text-gray-600">
                              New customer?{' '}
                              <Link 
                                href="/auth/register" 
                                className="text-[#2E8B57] font-bold hover:underline"
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
                className="lg:hidden p-2 rounded-xl bg-white hover:bg-gray-50 shadow-sm transition-colors"
                aria-label="Account"
              >
                <User size={20} className="text-gray-800" />
              </Link>

              {/* Cart */}
              <Link 
                href="/cart" 
                className="relative group"
                aria-label="Shopping cart"
              >
                <div className="flex items-center space-x-2 p-1 hover:scale-105 transition-all duration-300">
                  <div className="relative">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#90EE90] to-[#76D176] group-hover:from-[#7CD47C] group-hover:to-[#68C168] transition-all duration-300 shadow-lg group-hover:shadow-xl">
                      <ShoppingCart size={22} className="text-white" />
                    </div>
                    {cartCount > 0 && (
                      <div className="cart-badge">
                        {displayCartCount}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Mobile Search Bar (Hidden on Desktop) */}
          <div className="lg:hidden mt-2">
            <form onSubmit={handleSearch} className="relative">
              <div className="rounded-2xl overflow-hidden transition-all duration-500 border-2 border-gray-200 focus-within:border-[#90EE90]">
                <div className="relative flex items-center">
                  <div className="absolute left-4 flex items-center justify-center pointer-events-none">
                    <Search size={20} className="text-[#76D176]" />
                  </div>
                  <input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white focus:outline-none text-gray-900 placeholder-gray-500 text-sm"
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57] hover:from-[#7CD47C] hover:to-[#68C168] transition-all duration-300 font-bold text-sm flex items-center space-x-2"
                    disabled={!searchQuery.trim()}
                  >
                    <Search size={18} className="text-[#2E8B57]" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* ========== HORIZONTAL CATEGORIES ROW ========== */}
          <div className="categories-row-container">
            <div className="categories-row-inner md:translate-x-[-16px] lg:translate-x-[-24px]">
              {/* All Categories Button with Dropdown */}
              <div 
                className="relative"
                ref={categoriesMenuRef}
                onMouseEnter={() => setShowAllCategories(true)}
                onMouseLeave={() => setShowAllCategories(false)}
              >
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="all-categories-button"
                >
                  <Menu size={18} />
                  <span>All Categories</span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${showAllCategories ? 'rotate-180' : ''}`} />
                </button>

                {/* All Categories Dropdown */}
                {showAllCategories && (
                  <div 
                    className="absolute left-0 top-full mt-1 w-96 bg-white rounded-xl shadow-2xl z-50 animate-fadeIn border border-gray-200 overflow-hidden"
                    onMouseEnter={() => setShowAllCategories(true)}
                    onMouseLeave={() => setShowAllCategories(false)}
                  >
                    {/* Dropdown Header */}
                    <div className="p-4 bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57]">
                      <div className="flex items-center gap-2">
                        <Menu size={20} />
                        <span className="font-bold text-lg">All Categories</span>
                      </div>
                      <p className="text-sm opacity-90 mt-1">Browse all product categories</p>
                    </div>
                    
                    {/* Categories List */}
                    <div className="max-h-96 overflow-y-auto p-1">
                      <div className="grid grid-cols-2 gap-1 p-2">
                        {allCategories
                          .filter(cat => cat.is_active && cat.parent_id === null)
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((category) => (
                            <Link
                              key={category.id}
                              href={`/categories/${category.slug}`}
                              className="flex items-center px-4 py-3 hover:bg-[#F0FFF0] rounded-lg transition-all duration-200 group border border-transparent hover:border-[#90EE90]"
                              onClick={() => setShowAllCategories(false)}
                            >
                              <span className="text-sm font-medium text-gray-800 group-hover:text-[#2E8B57] group-hover:font-semibold flex-1">
                                {category.name}
                              </span>
                              <ArrowRight size={14} className="text-gray-400 group-hover:text-[#2E8B57] opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2" />
                            </Link>
                          ))}
                      </div>
                    </div>
                    
                    {/* Footer */}
                    <Link
                      href="/categories"
                      className="flex items-center justify-center gap-2 py-3 bg-gray-50 text-[#2E8B57] font-semibold text-sm hover:bg-[#F0FFF0] transition-colors border-t border-gray-100"
                      onClick={() => setShowAllCategories(false)}
                    >
                      <span>View All Categories</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </div>

              {/* Horizontal Categories Scroll */}
              <div 
                className="categories-row-scroll"
                ref={categoriesScrollRef}
              >
                {isLoadingCategories ? (
                  // Loading skeleton
                  Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="category-link">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))
                ) : topCategories.length > 0 ? (
                  topCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`category-link ${pathname.includes(category.slug) ? 'active' : ''}`}
                      onMouseEnter={() => handleCategoryHover(category)}
                      onMouseLeave={handleCategoryLeave}
                      onClick={() => router.push(`/categories/${category.slug}`)}
                    >
                      {category.name}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full py-2">
                    <p className="text-gray-500 text-sm">No categories available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Category Products Dropdown */}
            {activeCategory && categoryProducts.length > 0 && isHoveringCategory && (
              <div 
                className="category-dropdown"
                ref={categoryDropdownRef}
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <div className="category-dropdown-content">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {topCategories.find(c => c.slug === activeCategory)?.name || 'All Categories'}
                      </h3>
                      <p className="text-gray-600 mt-1 text-sm">
                        Popular products in this category
                      </p>
                    </div>
                    <Link
                      href={`/categories/${activeCategory}`}
                      className="px-5 py-2.5 bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57] hover:from-[#7CD47C] hover:to-[#68C168] font-bold text-sm rounded-xl transition-all duration-300 shadow hover:shadow-lg flex items-center space-x-2"
                      onClick={() => {
                        setActiveCategory(null);
                        setCategoryProducts([]);
                      }}
                    >
                      <span>View All</span>
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <div className="category-products-grid">
                    {categoryProducts.map((product) => (
                      <div
                        key={product.id}
                        className="category-product-card"
                        onClick={() => handleProductClick(product.slug)}
                      >
                        <div className="product-image-container">
                          <Image
                            src={getImageUrl(product)}
                            alt={product.name || 'Product image'}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="product-image"
                          />
                        </div>
                        <div className="product-info">
                          <h4 className="product-title">
                            {product.name || 'Product Name'}
                          </h4>
                          <div className="product-price">
                            {formatPrice(Number(product.price || 0))}
                          </div>
                          {product.rating && Number(product.rating) > 0 && (
                            <div className="flex items-center mt-2">
                              <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              <span className="text-xs font-semibold text-gray-700 ml-1">
                                {Number(product.rating).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu - Enhanced with Categories */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 backdrop-blur-sm" 
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Menu Panel */}
            <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl animate-slideIn">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-5">
                    <Link href="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow">
                        <Image 
                          src="/logo.jpeg" 
                          alt="Logo"
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-black text-[#2E8B57] text-md">Lando</div>
                        <div className="text-xs text-[#76D176] font-bold">Hypermarket</div>
                      </div>
                    </Link>
                    <button 
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <X size={22} />
                    </button>
                  </div>
                  
                  {/* Delivery Info in Mobile */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-[#90EE90] to-[#76D176] rounded-xl text-[#2E8B57]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock size={14} />
                        <span className="text-sm font-medium">Today {deliveryTime}</span>
                      </div>
                      <div className="free-delivery-badge px-2 py-1 rounded-full text-xs font-bold">
                        FREE
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPinIcon size={14} />
                      <span className="text-sm">{deliveryLocation}</span>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-2 p-3 bg-[#F0FFF0] rounded-2xl border border-[#90EE90]">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-white shadow">
                        {user?.profile_picture_url ? (
                          <Image
                            src={user.profile_picture_url}
                            alt="Profile"
                            width={48}
                            height={48}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#90EE90] to-[#76D176] flex items-center justify-center">
                            <User size={22} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#2E8B57] truncate">{user?.name}</div>
                        <div className="text-sm text-gray-600 truncate">{user?.email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link 
                        href="/auth/login" 
                        className="block py-3 text-center bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57] rounded-2xl font-bold text-sm shadow-lg"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign In / Register
                      </Link>
                    </div>
                  )}
                </div>

                {/* Menu Content */}
                <div className="flex-1 overflow-y-auto p-5 bg-white">
                  <div className="space-y-6">
                    {/* Mobile Navigation Links */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-[#2E8B57] text-sm mb-2 uppercase tracking-wider text-gray-500">Navigation</h3>
                      <Link
                        href="/"
                        className="flex items-center justify-between p-3 hover:bg-[#F0FFF0] rounded-xl transition-colors group border border-gray-100 hover:border-[#90EE90]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-[#F0FFF0] mr-3">
                            <ShoppingBag size={18} className="text-[#2E8B57]" />
                          </div>
                          <span className="font-bold text-[#2E8B57]">Home</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-[#2E8B57]" />
                      </Link>
                      <Link
                        href="/products"
                        className="flex items-center justify-between p-3 hover:bg-[#F0FFF0] rounded-xl transition-colors group border border-gray-100 hover:border-[#90EE90]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-[#F0FFF0] mr-3">
                            <ShoppingBag size={18} className="text-[#2E8B57]" />
                          </div>
                          <span className="font-bold text-[#2E8B57]">Shop All</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-[#2E8B57]" />
                      </Link>
                      <Link
                        href="/deals"
                        className="flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition-colors group border border-gray-100 hover:border-red-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-red-100 mr-3">
                            <Flame size={18} className="text-red-600" />
                          </div>
                          <span className="font-bold">Hot Deals</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-red-500" />
                      </Link>
                      <Link
                        href="#new-arrivals"
                        className="flex items-center justify-between p-3 hover:bg-[#F0FFF0] rounded-xl transition-colors group border border-gray-100 hover:border-[#90EE90]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center">
                          <div className="p-2 rounded-lg bg-[#F0FFF0] mr-3">
                            <Sparkles size={18} className="text-[#2E8B57]" />
                          </div>
                          <span className="font-bold text-[#2E8B57]">New Arrivals</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-[#2E8B57]" />
                      </Link>
                    </div>

                    {/* Mobile Categories Grid */}
                    <div>
                      <h3 className="font-bold text-[#2E8B57] text-sm mb-3 uppercase tracking-wider text-gray-500">Categories</h3>
                      <div className="mobile-categories-grid">
                        {topCategories.map((category) => (
                          <Link
                            key={category.id}
                            href={`/categories/${category.slug}`}
                            className="mobile-category-item"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {category.name.length > 15 
                              ? category.name.substring(0, 15) + '...' 
                              : category.name}
                          </Link>
                        ))}
                      </div>
                      <Link
                        href="/categories"
                        className="block w-full mt-3 py-2.5 text-center bg-gradient-to-r from-[#90EE90] to-[#76D176] text-[#2E8B57] rounded-xl font-bold text-sm shadow-lg hover:from-[#7CD47C] hover:to-[#68C168] transition-all duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        View All Categories
                      </Link>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        href="/wishlist"
                        className="p-3 rounded-2xl bg-red-50 border border-red-200 text-center group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 w-fit mx-auto mb-2">
                          <Heart size={22} className="text-white" />
                        </div>
                        <div className="font-bold text-gray-900">Wishlist</div>
                        <div className="text-xs text-gray-600 mt-1">Saved items</div>
                      </Link>
                      <Link
                        href="/cart"
                        className="p-3 rounded-2xl bg-[#F0FFF0] border border-[#90EE90] text-center group"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-[#90EE90] to-[#76D176] w-fit mx-auto mb-2">
                          <ShoppingCart size={22} className="text-white" />
                        </div>
                        <div className="font-bold text-[#2E8B57]">My Cart</div>
                        <div className="text-xs text-gray-600 mt-1">{cartCount} items</div>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 bg-white">
                  <div className="flex items-center justify-center space-x-4 text-sm font-semibold text-[#2E8B57]">
                    <Link href="/terms" onClick={() => setMobileMenuOpen(false)}>Terms</Link>
                    <Link href="/privacy" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
                    <Link href="/help" onClick={() => setMobileMenuOpen(false)}>Help</Link>
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-3 font-medium">
                    © {new Date().getFullYear()} Carrefour Hypermarket
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search Overlay - Enhanced */}
        {mobileSearchOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-white">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 bg-white">
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
                      className="w-full px-4 py-3 pl-12 bg-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#90EE90] border-2 border-gray-200 focus:border-[#90EE90] text-sm"
                      autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#76D176]" />
                  </div>
                </form>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 bg-white">
                {/* Popular Searches */}
                {searchQuery.trim() === '' && (
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">Popular Searches</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickSearches.slice(0, 8).map((item) => (
                        <button
                          key={item}
                          onClick={() => handleQuickSearch(item)}
                          className="px-3 py-2.5 bg-white hover:bg-[#F0FFF0] text-gray-700 rounded-xl text-sm font-bold transition-all duration-300 text-left border border-gray-200 hover:border-[#90EE90]"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Categories Grid in Mobile Search */}
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Categories</h3>
                  <div className="mobile-categories-grid">
                    {topCategories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        className="mobile-category-item"
                        onClick={() => setMobileSearchOpen(false)}
                      >
                        {category.name.length > 12 
                          ? category.name.substring(0, 12) + '...' 
                          : category.name}
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