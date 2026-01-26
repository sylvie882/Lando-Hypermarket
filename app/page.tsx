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
  ChevronRight
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

        /* Responsive grid for product cards */
        /* Mobile: 1 card per row */
        @media (max-width: 767px) {
          .product-grid {
            grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            gap: 1rem !important;
          }
        }
        
        /* Tablet: 3 cards per row */
        @media (min-width: 768px) and (max-width: 1023px) {
          .product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
        
        /* Desktop: 6 cards per row */
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>

      {/* Banner Section - Adjusted to remove gap with navbar */}
      <section className="pt-0 pb-0 px-4 sm:px-12 border-radius-b-lg overflow-hidden">
        <div className="w-full">
          <BannerCarousel
            height={{ mobile: '280px', desktop: '380px' }}
            rounded={false}
          />
        </div>
      </section>

      {/* Categories Section - Directly after banner */}
      {categories.length > 0 && (
        <section 
          ref={categoriesSectionRef}
          className="py-8 bg-white px-4 sm:px-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Best-Selling Categories</h2>
              <div className="flex items-center space-x-4">
                <Link 
                  href="/categories" 
                  className="text-green-600 hover:text-green-700 font-medium flex items-center"
                >
                  View All <ArrowRight size={16} className="ml-1" />
                </Link>
                {/* Scroll buttons for mobile/desktop */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => scrollCategories('left')}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors hidden sm:block"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={20} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollCategories('right')}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors hidden sm:block"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Horizontal scrolling categories */}
            <div className="relative">
              <div 
                ref={categoriesScrollRef}
                className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
              >
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="flex-shrink-0 w-36 sm:w-40 md:w-44 bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 text-center group border border-gray-100"
                  >
                    <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-green-50 transition-colors">
                      {category.image ? (
                        <img 
                          src={getImageUrl(category.image)} 
                          alt={category.name}
                          className="w-full h-full object-cover rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag size={28} className="text-gray-600 group-hover:text-green-600" />
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm md:text-base group-hover:text-green-600 line-clamp-2">
                      {category.name}
                    </h3>
                    {category.products_count && (
                      <p className="text-xs text-gray-500 mt-1">{category.products_count} items</p>
                    )}
                  </Link>
                ))}
              </div>
              
              {/* Scroll gradient indicators */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
          </div>
        </section>
      )}

      {/* Featured Products Section - 12 PRODUCTS */}
      <section 
        ref={featuredSectionRef}
        className="py-12 bg-gray-50 px-4 sm:px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link 
              href="/products?featured=true" 
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {featuredProducts.length > 0 ? (
            <>
              {/* UPDATED: 6 cards per row on desktop with smaller gap */}
              <div className="product-grid grid">
                {featuredProducts.slice(0, 12).map((product, index) => (
                  <div 
                    key={product.id} 
                    className="scroll-hover bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300"
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
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* PERSONALIZED RECOMMENDATIONS SECTION - FIXED */}
      {isAuthenticated ? (
        <section className="py-12 bg-white border-t border-gray-100 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <PersonalizedRecommendations 
              title="Recommended For You"
              limit={12}
              showHeader={true}
              showStrategy={true}
            />
          </div>
        </section>
      ) : (
        <section className="py-12 bg-white border-t border-gray-100 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                ℹ️ Sign in to see personalized recommendations tailored just for you
              </p>
            </div>
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sign in for personalized recommendations
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Log in to your account to see products tailored just for you based on your preferences and browsing history.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/login"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                >
                  Sign In
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                >
                  Create Account
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals Section - 12 PRODUCTS */}
      <section id="new-arrivals"
        ref={newArrivalsSectionRef}
        className="py-12 bg-white px-4 sm:px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <Link 
              href="/products?new=true" 
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {newArrivals.length > 0 ? (
            <>
              {/* UPDATED: 6 cards per row on desktop with smaller gap */}
              <div className="product-grid grid">
                {newArrivals.slice(0, 12).map((product, index) => (
                  <div 
                    key={product.id} 
                    className="scroll-hover bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 relative"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">NEW</span>
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
            <div className="text-center py-12">
              <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No new arrivals available</p>
            </div>
          )}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 bg-white px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-white mb-6 md:mb-0 md:mr-8">
                  <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-4">
                    <Gift size={16} />
                    <span className="ml-2 font-medium">Limited Time Offer</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4">Weekend Special Sale</h3>
                  <p className="text-lg mb-6">Up to 50% off on fresh produce</p>
                  <Link
                    href="/deals"
                    className="inline-flex items-center bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Shop Now
                    <ArrowRight className="ml-2" size={18} />
                  </Link>
                </div>
                <div className="relative">
                  <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl md:text-5xl font-bold mb-2">50%</div>
                      <div className="text-lg">OFF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Support Floating Button */}
      <div className="fixed right-6 bottom-6 z-50">
        <button
          onClick={() => setShowCustomerSupport(!showCustomerSupport)}
          className="text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
          }}
          aria-label="Customer Support"
        >
          <HelpCircle size={28} />
        </button>
        
        {showCustomerSupport && (
          <div className="absolute right-0 bottom-full mb-4 bg-white rounded-2xl shadow-2xl border border-gray-200 w-72 overflow-hidden animate-slide-up">
            <div 
              className="p-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
              }}
            >
              <h3 className="font-bold text-lg">Need Help?</h3>
              <p className="text-sm opacity-90">We're here 24/7</p>
            </div>
            
            <div className="p-3 space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-green-100">
                  <MessageCircle size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">WhatsApp</div>
                  <div className="text-xs text-gray-600">Instant reply</div>
                </div>
              </a>
              
              <a
                href="tel:+254716354589"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-100">
                  <Phone size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Call Us</div>
                  <div className="text-xs text-gray-600">+254 716 354 589</div>
                </div>
              </a>
              
              <Link
                href="/help"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-purple-100">
                  <HelpCircle size={20} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Help Center</div>
                  <div className="text-xs text-gray-600">FAQs & guides</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed right-6 bottom-24 text-white p-3 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
        }}
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

export default HomePage;