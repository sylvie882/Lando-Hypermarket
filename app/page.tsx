'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import BannerCarousel from '@/components/ui/BannerCarousel';
import { 
  ArrowRight, 
  Truck, 
  Shield, 
  Clock, 
  Star, 
  Sparkles,
  Package,
  ShoppingBag,
  Users,
  MessageCircle,
  ArrowUp,
  HelpCircle,
  Phone,
  Gift,
  Award,
  ShieldCheck,
  Clock4,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import PersonalizedRecommendations from '@/components/ui/PersonalizedRecommendations';
import { useAuth } from '@/lib/auth';

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  
  // Get authentication status from auth context
  const { isAuthenticated, user, token } = useAuth();

  console.log('HomePage - Auth status:', { 
    isAuthenticated, 
    hasUser: !!user, 
    hasToken: !!token,
    user: user?.name || 'No user'
  });

  // Refs
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const newArrivalsSectionRef = useRef<HTMLDivElement>(null);
  const subscriptionSectionRef = useRef<HTMLDivElement>(null);

  // Colors - QuickMart style
  const colors = {
    primary: '#90EE90', // Light Green
    primaryDark: '#5CD65C', // Darker Green
    gold: '#FFD700', // Gold
    orange: '#FFA500', // Warm Orange
    secondary: '#333333',
    green: '#28a745',
    yellow: '#ffc107',
    lightGray: '#f8f9fa',
    dark: '#2c3e50'
  };

  const whatsappNumber = '+254716354589';
  const whatsappMessage = encodeURIComponent('Hello! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
      
      const sections = [
        featuredSectionRef.current,
        categoriesSectionRef.current,
        newArrivalsSectionRef.current,
        subscriptionSectionRef.current
      ];
      
      sections.forEach(section => {
        if (section) {
          const rect = section.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight - 100;
          
          if (isVisible) {
            section.classList.add('animate-fade-up');
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll categories horizontally
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const scrollAmount = 300;
      const currentScroll = categoriesScrollRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      categoriesScrollRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  // Fetch data with 12 products limit
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch 12 featured products
      const featuredRes = await api.products.getFeatured();
      let featuredData = featuredRes.data || [];
      
      // If we have less than 12 featured products, fetch more products
      if (featuredData.length < 12) {
        try {
          const moreProductsRes = await api.products.getAll({ 
            per_page: 12 - featuredData.length,
            sort: 'featured',
            order: 'desc' 
          });
          const moreProducts = moreProductsRes.data?.data || moreProductsRes.data || [];
          featuredData = [...featuredData, ...moreProducts];
        } catch (error) {
          console.error('Error fetching additional products:', error);
        }
      }
      
      // Ensure we have exactly 12 products (slice if more, pad if less)
      if (featuredData.length > 12) {
        featuredData = featuredData.slice(0, 12);
      }
      
      setFeaturedProducts(featuredData);

      // Fetch categories
      const categoriesRes = await api.categories.getAll();
      const allCategories = categoriesRes.data || [];
      // Filter active categories and take first 15 for horizontal scroll
      const activeCategories = allCategories
        .filter((cat: CategoryData) => cat.is_active)
        .slice(0, 15);
      setCategories(activeCategories);

      // Fetch 12 new arrivals
      const newArrivalsRes = await api.products.getAll({ 
        per_page: 12, 
        sort: 'created_at', 
        order: 'desc' 
      });
      let newArrivalsData = newArrivalsRes.data?.data || newArrivalsRes.data || [];
      
      // Ensure exactly 12 new arrivals
      if (newArrivalsData.length > 12) {
        newArrivalsData = newArrivalsData.slice(0, 12);
      }
      
      setNewArrivals(newArrivalsData);

    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  const getImageUrl = useCallback((path: string | null | undefined): string => {
    if (!path) return '/placeholder.jpg';
    
    if (path.startsWith('http')) {
      return path;
    }
    
    let cleanPath = path;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.replace('storage/', '');
    }
    
    return `https://api.hypermarket.co.ke/storage/${cleanPath}`;
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Custom scroll animation styles */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-up {
          animation: fadeUp 0.6s ease-out forwards;
        }
        
        .section-hidden {
          opacity: 0;
          transform: translateY(30px);
        }
        
        .scroll-hover {
          transition: transform 0.3s ease;
        }
        
        .scroll-hover:hover {
          transform: translateY(-5px);
        }
        
        /* Hide scrollbar but keep functionality */
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out forwards;
        }

        /* Responsive grid for product cards - tighter layout */
        /* Mobile: 2 cards per row */
        @media (max-width: 639px) {
          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
        
        /* Tablet: 4 cards per row */
        @media (min-width: 640px) and (max-width: 1023px) {
          .product-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
        
        /* Desktop: 6 cards per row */
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }

        /* Category cards responsive */
        @media (max-width: 639px) {
          .category-card {
            width: 28vw !important;
            min-width: 28vw !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 767px) {
          .category-card {
            width: 22vw !important;
            min-width: 22vw !important;
          }
        }
        
        @media (min-width: 768px) and (max-width: 1023px) {
          .category-card {
            width: 18vw !important;
            min-width: 18vw !important;
          }
        }
        
        @media (min-width: 1024px) {
          .category-card {
            width: 11.5vw !important;
            min-width: 11.5vw !important;
          }
        }

        /* Section spacing */
        .compact-section {
          padding-top: 1.5rem !important;
          padding-bottom: 1.5rem !important;
        }
        
        @media (min-width: 768px) {
          .compact-section {
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
          }
        }

        /* Floating buttons responsive sizes */
        @media (max-width: 639px) {
          .floating-button {
            width: 44px !important;
            height: 44px !important;
          }
          .floating-button svg {
            width: 20px !important;
            height: 20px !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1023px) {
          .floating-button {
            width: 48px !important;
            height: 48px !important;
          }
          .floating-button svg {
            width: 22px !important;
            height: 22px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .floating-button {
            width: 52px !important;
            height: 52px !important;
          }
          .floating-button svg {
            width: 24px !important;
            height: 24px !important;
          }
        }
      `}</style>

      {/* Banner Section - Tight spacing */}
      <section className="pt-0 pb-0 px-4 sm:px-6 md:px-8 overflow-hidden">
        <div className="w-full">
          <BannerCarousel
            height={{ mobile: '280px', desktop: '380px' }}
            rounded={false}
          />
        </div>
      </section>

      {/* Value Propositions - Compact */}
      <div className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Truck className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Free Delivery</p>
                <p className="text-xs text-gray-600">Above Ksh 2,000</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                <p className="text-xs text-gray-600">100% Protected</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">24/7 Support</p>
                <p className="text-xs text-gray-600">Always Here</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="text-orange-600" size={20} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Quality Guarantee</p>
                <p className="text-xs text-gray-600">Premium Products</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section - Compact and Attractive */}
      {categories.length > 0 && (
        <section 
          ref={categoriesSectionRef}
          className="compact-section bg-white px-4 sm:px-6 md:px-8"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">Top Categories</h2>
              </div>
              <Link 
                href="/categories" 
                className="text-green-600 hover:text-green-700 font-medium flex items-center text-sm"
              >
                View All
                <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
            
            {/* Horizontal scrolling categories */}
            <div className="relative">
              <div 
                ref={categoriesScrollRef}
                className="flex space-x-3 md:space-x-4 overflow-x-auto pb-4 hide-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
              >
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="category-card flex-shrink-0 bg-white rounded-xl p-3 hover:shadow-lg transition-all duration-300 text-center group border border-gray-100 hover:border-green-200"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-full flex items-center justify-center group-hover:from-green-100 group-hover:to-emerald-100 transition-all duration-300">
                      {category.image ? (
                        <img 
                          src={getImageUrl(category.image)} 
                          alt={category.name}
                          className="w-full h-full object-cover rounded-full p-1"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag size={24} className="text-green-600 group-hover:text-emerald-700" />
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 text-xs md:text-sm group-hover:text-green-600 line-clamp-2">
                      {category.name}
                    </h3>
                    {category.products_count && (
                      <p className="text-xs text-gray-500 mt-1">{category.products_count} items</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section - 12 PRODUCTS */}
      <section 
        ref={featuredSectionRef}
        className="compact-section bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 md:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg">
                <Flame size={20} className="text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Featured Products</h2>
            </div>
            <Link 
              href="/products?featured=true" 
              className="text-green-600 hover:text-green-700 font-medium flex items-center text-sm"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          
          {featuredProducts.length > 0 ? (
            <>
              {/* UPDATED: 6 cards per row on desktop with smaller gap */}
              <div className="product-grid grid">
                {featuredProducts.slice(0, 12).map((product, index) => (
                  <div 
                    key={product.id} 
                    className="scroll-hover bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-green-300 overflow-hidden transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <ProductCard 
                      product={product} 
                      onViewTrack={trackProductView}
                    />
                  </div>
                ))}
              </div>
              
              {/* Show count */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing {featuredProducts.length} featured products
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Package size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* PERSONALIZED RECOMMENDATIONS SECTION - FIXED */}
      <section className="compact-section bg-white px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          {isAuthenticated ? (
            <PersonalizedRecommendations 
              title={
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <span className="text-xl md:text-2xl font-bold text-gray-900">
                    Recommended For You
                  </span>
                </div>
              }
              limit={12}
              showHeader={true}
              showStrategy={true}
            />
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:mr-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Sparkles size={20} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Personalize Your Experience
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-4">
                    Sign in to unlock personalized recommendations based on your preferences and shopping history.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/auth/login"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center shadow-sm hover:shadow"
                    >
                      Sign In
                      <ArrowRight size={16} className="ml-2" />
                    </Link>
                    <Link
                      href="/auth/register"
                      className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-5 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-48 h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">✨</div>
                      <div className="text-sm text-blue-800 font-medium">Tailored Just For You</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals Section - 12 PRODUCTS */}
      <section 
        ref={newArrivalsSectionRef}
        className="compact-section bg-white px-4 sm:px-6 md:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                <Clock4 size={20} className="text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">New Arrivals</h2>
            </div>
            <Link 
              href="/products?new=true" 
              className="text-green-600 hover:text-green-700 font-medium flex items-center text-sm"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          
          {newArrivals.length > 0 ? (
            <>
              {/* UPDATED: 6 cards per row on desktop with smaller gap */}
              <div className="product-grid grid">
                {newArrivals.slice(0, 12).map((product, index) => (
                  <div 
                    key={product.id} 
                    className="scroll-hover bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300 overflow-hidden transition-all duration-300 relative group"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs px-2 py-1 rounded font-bold shadow-sm">
                        NEW
                      </span>
                    </div>
                    <ProductCard 
                      product={product} 
                      onViewTrack={trackProductView}
                    />
                  </div>
                ))}
              </div>
              
              {/* Show count */}
              <div className="mt-4 text-center text-sm text-gray-500">
                Showing {newArrivals.length} new arrivals
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Sparkles size={40} className="mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No new arrivals available</p>
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banner - Compact */}
      <section className="compact-section px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-white mb-6 md:mb-0 md:mr-8">
                  <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
                    <Gift size={16} />
                    <span className="ml-2 font-medium">Weekend Special</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Fresh Produce Sale!</h3>
                  <p className="text-lg mb-6 opacity-90">Up to 50% off on organic fruits & vegetables</p>
                  <Link
                    href="/deals"
                    className="inline-flex items-center bg-white text-green-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Shop Now
                    <ArrowRight className="ml-2" size={18} />
                  </Link>
                </div>
                <div className="relative">
                  <div className="w-40 h-40 md:w-48 md:h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold mb-2">50%</div>
                      <div className="text-lg font-semibold">OFF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="floating-button flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)'
          }}
          aria-label="Chat on WhatsApp"
        >
          <MessageSquare className="text-white" />
        </a>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`floating-button flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            boxShadow: '0 4px 20px rgba(90, 221, 90, 0.4)'
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="text-white" />
        </button>

        {/* Customer Support Button */}
        <button
          onClick={() => setShowCustomerSupport(!showCustomerSupport)}
          className="floating-button flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            boxShadow: '0 4px 20px rgba(90, 221, 90, 0.4)'
          }}
          aria-label="Customer Support"
        >
          <HelpCircle className="text-white" />
        </button>

        {/* Customer Support Dropdown */}
        {showCustomerSupport && (
          <div className="absolute right-0 bottom-full mb-3 bg-white rounded-xl shadow-2xl border border-gray-200 w-64 overflow-hidden animate-slide-up">
            <div 
              className="p-3 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
              }}
            >
              <h3 className="font-bold text-base">Need Help?</h3>
              <p className="text-xs opacity-90">We're here 24/7</p>
            </div>
            
            <div className="p-2 space-y-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-green-100">
                  <MessageSquare size={18} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">WhatsApp</div>
                  <div className="text-xs text-gray-600">Instant reply</div>
                </div>
              </a>
              
              <a
                href="tel:+254716354589"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <Phone size={18} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Call Us</div>
                  <div className="text-xs text-gray-600">+254 716 354 589</div>
                </div>
              </a>
              
              <Link
                href="/help"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-purple-100">
                  <HelpCircle size={18} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Help Center</div>
                  <div className="text-xs text-gray-600">FAQs & guides</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;