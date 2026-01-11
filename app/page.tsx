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

  // Refs
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const newArrivalsSectionRef = useRef<HTMLDivElement>(null);
  const subscriptionSectionRef = useRef<HTMLDivElement>(null);

  // Colors - QuickMart style
  const colors = {
    primary: '#e30613',
    primaryDark: '#b3050f',
    primaryLight: '#fce8e9',
    secondary: '#333333',
    green: '#28a745',
    orange: '#ff6b35',
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
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
      `}</style>

     <section className="py-8 px-4 md:px-6 lg:px-8">
  <div className="container mx-auto max-w-7xl shadow-md rounded-xl overflow-hidden">
    <BannerCarousel
      height={{ mobile: '280px', desktop: '380px' }}
      // showTitle={true}
      rounded={false}
    />
  </div>
</section>


      {/* Features Grid - QuickMart Style */}
      {/* <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: <Truck size={24} />,
                title: 'Free Delivery',
                desc: 'Over Ksh 2000',
                color: 'text-red-600'
              },
              {
                icon: <Clock4 size={24} />,
                title: '24/7 Service',
                desc: 'Open All Time',
                color: 'text-red-600'
              },
              {
                icon: <ShieldCheck size={24} />,
                title: '100% Secure',
                desc: 'Safe Shopping',
                color: 'text-red-600'
              },
              {
                icon: <Award size={24} />,
                title: 'Quality Products',
                desc: 'Guaranteed',
                color: 'text-red-600'
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className={`${feature.color}`}>
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{feature.title}</h4>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

    {/* Categories Section - HORIZONTAL SCROLL LIKE QUICKMART */}
{categories.length > 0 && (
  <section 
    ref={categoriesSectionRef}
    className="section-hidden py-12 bg-white"
  >
    <div className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl  font-bold text-gray-900">Best-Selling Categories</h2>
        <div className="flex items-center space-x-4">
          <Link 
            href="/categories" 
            className="text-red-600 hover:text-red-700 font-medium flex items-center"
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
              className="flex-shrink-0 w-36 sm:w-40 md:w-44 bg-white rounded-lg p-4 hover:shadow-lg transition-all duration-300 text-center group"
            >
              {/* LARGER IMAGE - Removed border from container */}
              <div className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-red-50 transition-colors">
                {category.image ? (
                  <img 
                    src={getImageUrl(category.image)} 
                    alt={category.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                ) : (
                  <ShoppingBag size={28} className="text-gray-600 group-hover:text-red-600" />
                )}
              </div>
              <h3 className="font-medium text-gray-900 text-sm md:text-base group-hover:text-red-600 line-clamp-2">
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
        className="section-hidden py-12 bg-gray-50"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link 
              href="/products?featured=true" 
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {featuredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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

      {/* New Arrivals Section - 12 PRODUCTS */}
      <section 
        ref={newArrivalsSectionRef}
        className="section-hidden py-12 bg-white"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
            <Link 
              href="/products?new=true" 
              className="text-red-600 hover:text-red-700 font-medium flex items-center"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          
          {newArrivals.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {newArrivals.slice(0, 12).map((product, index) => (
                  <div 
                    key={product.id} 
                    className="scroll-hover bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300"
                    style={{
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">NEW</span>
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
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-8 md:p-12">
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
                    className="inline-flex items-center bg-white text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
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