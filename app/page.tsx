'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import CategoryCard from '@/components/ui/CategoryCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  ArrowRight, 
  Truck, 
  Shield, 
  Clock, 
  Star, 
  ChevronLeft, 
  ChevronRight,
  Leaf,
  Award,
  Heart,
  CheckCircle,
  Sprout,
  Package,
  Truck as TruckIcon,
  ShieldCheck,
  Clock4,
  TrendingUp,
  ShoppingBag,
  Users,
  ThumbsUp,
  MessageCircle,
  ArrowUp
} from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  mobile_image: string | null;
  button_text: string | null;
  button_link: string | null;
  order: number;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  type: 'homepage' | 'category' | 'promotional' | 'sidebar';
  category_slug: string | null;
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
  image_url?: string; // ADD THIS LINE
  mobile_image_url?: string; // ADD THIS LINE
}

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
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // WhatsApp phone number
  const whatsappNumber = '+254716354589';
  const whatsappMessage = encodeURIComponent('Hello! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Handle scroll to show/hide the top arrow
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // SIMPLIFIED: Direct URL construction for banners
  const getBannerImageUrl = (banner: Banner, isMobile = false): string => {
    const imagePath = isMobile ? banner.mobile_image || banner.image : banner.image;
    
    if (!imagePath) {
      return '/default-banner.jpg';
    }
    
    // If already full URL, return it
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Clean path
    let cleanPath = imagePath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Remove 'storage/' if present
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.replace('storage/', '');
    }
    
    // Direct URL construction - hardcoded base
    const baseUrl = 'https://api.hypermarket.co.ke';
    const finalUrl = `${baseUrl}/storage/${cleanPath}`;
    
    return finalUrl;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch data in parallel
      const [featuredRes, categoriesRes, bannersRes] = await Promise.allSettled([
        api.products.getFeatured(),
        api.categories.getAll(),
        api.banners.getHomepage()
      ]);

      // Handle featured products
      if (featuredRes.status === 'fulfilled') {
        setFeaturedProducts(featuredRes.value.data || []);
      } else {
        console.error('Failed to fetch featured products:', featuredRes.reason);
      }

      // Handle categories
      if (categoriesRes.status === 'fulfilled') {
        const categoriesData = categoriesRes.value.data || [];
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch categories:', categoriesRes.reason);
      }

      // Handle banners - SIMPLIFIED
      if (bannersRes.status === 'fulfilled') {
        const response = bannersRes.value;
        console.log('Banners API response:', response);
        
        let bannerData: Banner[] = [];
        
        // Try to extract banners from response
        if (response.data) {
          if (Array.isArray(response.data)) {
            bannerData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            bannerData = response.data.data;
          } else if (response.data.banners && Array.isArray(response.data.banners)) {
            bannerData = response.data.banners;
          } else if (response.data.success && Array.isArray(response.data.data)) {
            bannerData = response.data.data;
          }
        }
        
        console.log('Extracted banners:', bannerData);
        
        // Filter active homepage banners
        const activeBanners = bannerData
          .filter(banner => {
            const isActive = banner.is_active === true;
            const isHomepage = banner.type === 'homepage';
            const hasImage = banner.image || banner.image_url;
            
            return isActive && isHomepage && hasImage;
          })
          .sort((a, b) => a.order - b.order);
        
        console.log('Active banners to display:', activeBanners);
        setBanners(activeBanners);
        
        // Test banner URLs
        activeBanners.forEach((banner, index) => {
          const url = getBannerImageUrl(banner, false);
          console.log(`Banner ${index} test URL:`, url);
        });
      } else {
        console.error('Failed to fetch banners:', bannersRes.reason);
      }

      // Fetch new arrivals separately
      try {
        const productsRes = await api.products.getAll({ 
          per_page: 12, 
          sort: 'created_at', 
          order: 'desc' 
        });
        const productsData = productsRes.data;
        setNewArrivals(Array.isArray(productsData?.data) ? productsData.data : productsData || []);
      } catch (error) {
        console.error('Failed to fetch new arrivals:', error);
      }
      
    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextBanner = () => {
    if (banners.length <= 1) return;
    setActiveBannerIndex((prevIndex) => 
      prevIndex === banners.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevBanner = () => {
    if (banners.length <= 1) return;
    setActiveBannerIndex((prevIndex) => 
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      nextBanner();
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Handle banner click tracking
  const handleBannerClick = async (bannerId: number) => {
    try {
      await api.banners.trackClick(bannerId);
    } catch (error) {
      console.error('Failed to track banner click:', error);
    }
  };

  // Handle image error
  const handleImageError = (bannerId: number) => {
    console.error(`Banner ${bannerId} image failed to load`);
    setImageErrors(prev => new Set(prev).add(bannerId));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Floating WhatsApp Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 hover:shadow-xl"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle size={28} />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          <span className="inline-block">!</span>
        </span>
      </a>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed right-6 z-50 bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 hover:scale-110 hover:shadow-xl ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ bottom: '100px' }}
        aria-label="Scroll to top"
      >
        <ArrowUp size={28} />
      </button>

      {/* SIMPLIFIED BANNER SECTION */}
<section className="relative">
  {banners.length > 0 ? (
    <>
      {/* Desktop Banner - Reduced height */}
      <div className="hidden md:block relative h-[400px] overflow-hidden">
        {banners.map((banner, index) => {
          const imageUrl = getBannerImageUrl(banner, false);
          const hasError = imageErrors.has(banner.id);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {hasError ? (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <h2 className="text-3xl font-bold mb-4">{banner.title}</h2>
                    <p className="text-xl">Image failed to load</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Use img tag instead of background-image */}
                  <img
                    src={imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => handleImageError(banner.id)}
                    onLoad={() => console.log(`✅ Banner ${banner.id} loaded`)}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                  
                  <div className="relative h-full flex items-center">
                    <div className="container mx-auto px-8">
                      <div className="max-w-2xl">
                        <h1 className="text-4xl font-bold mb-4 text-white">
                          {banner.title}
                        </h1>
                        {banner.subtitle && (
                          <p className="text-xl mb-8 text-white">
                            {banner.subtitle}
                          </p>
                        )}
                        {banner.button_text && (
                          <a
                            href={banner.button_link || '#'}
                            className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-base"
                            onClick={() => handleBannerClick(banner.id)}
                          >
                            {banner.button_text}
                            <ArrowRight className="ml-3" size={20} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        
        {/* Navigation */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-orange-600 p-2 rounded-full shadow-lg z-20"
              aria-label="Previous banner"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextBanner}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-orange-600 p-2 rounded-full shadow-lg z-20"
              aria-label="Next banner"
            >
              <ChevronRight size={20} />
            </button>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveBannerIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full ${
                    index === activeBannerIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Mobile Banner - Reduced height */}
      <div className="md:hidden relative h-[300px] overflow-hidden">
        {banners.map((banner, index) => {
          const imageUrl = getBannerImageUrl(banner, true);
          const hasError = imageErrors.has(banner.id);
          
          return (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              {hasError ? (
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500 to-orange-600 flex items-end pb-4">
                  <div className="text-white p-4">
                    <h2 className="text-xl font-bold mb-1">{banner.title}</h2>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={() => handleImageError(banner.id)}
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                  
                  <div className="relative h-full flex items-end pb-4 px-4">
                    <div>
                      <h1 className="text-xl font-bold mb-2 text-white">
                        {banner.title}
                      </h1>
                      {banner.subtitle && (
                        <p className="text-sm mb-4 text-white">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.button_text && (
                        <a
                          href={banner.button_link || '#'}
                          className="inline-flex items-center bg-white text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-all duration-300 text-sm"
                          onClick={() => handleBannerClick(banner.id)}
                        >
                          {banner.button_text}
                          <ArrowRight className="ml-2" size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
        
        {/* Mobile Dots */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveBannerIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === activeBannerIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  ) : (
    // Fallback if no banners - also reduced height
    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Fresh Farm Produce Delivered Daily
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Farm-fresh vegetables, fruits, and groceries harvested at peak ripeness
          </p>
          <a
            href="/products"
            className="inline-flex items-center bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-base"
          >
            Shop Now
            <ArrowRight className="ml-3" size={20} />
          </a>
        </div>
      </div>
    </div>
  )}
</section>




      {/* Features Section - Redesigned */}
<section className="py-20 bg-gradient-to-b from-orange-50/50 to-white">
  <div className="container mx-auto px-4">
    {/* Header */}
    <div className="text-center mb-16">
      {/* <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full mb-6">
        <CheckCircle size={20} />
        <span className="text-sm font-semibold">Premium Quality</span>
      </div> */}
      <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
        Why <span className="relative inline-block">
          <span className="relative z-10 text-orange-600">Lando</span>
          <span className="absolute bottom-0 left-0 w-full h-3 bg-orange-200/60 -rotate-1 -z-0"></span>
        </span> Stands Out
      </h2>
      <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
        Famous and renowned throughout the land for our exceptional quality and service
      </p>
    </div>
    
    {/* Features Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        {
          icon: <Leaf className="text-green-600" size={48} />,
          title: '100% Organic',
          description: 'Purely natural, chemical-free produce from trusted local farms',
          stats: '100% Natural',
          gradient: 'from-green-500 to-emerald-600',
          bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          shadowColor: 'shadow-green-100'
        },
        {
          icon: <Truck className="text-orange-600" size={48} />,
          title: 'Same-Day Delivery',
          description: 'Harvested & delivered fresh within hours, never frozen',
          stats: 'Within 24 Hours',
          gradient: 'from-orange-500 to-amber-600',
          bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50',
          borderColor: 'border-orange-200',
          shadowColor: 'shadow-orange-100'
        },
        {
          icon: <Award className="text-purple-600" size={48} />,
          title: 'Award Winning',
          description: 'Recognized for excellence in quality and sustainability',
          stats: '5+ Awards',
          gradient: 'from-purple-500 to-violet-600',
          bgColor: 'bg-gradient-to-br from-purple-50 to-violet-50',
          borderColor: 'border-purple-200',
          shadowColor: 'shadow-purple-100'
        },
        {
          icon: <Heart className="text-pink-600" size={48} />,
          title: 'Farm Fresh',
          description: 'Harvested at peak ripeness for maximum flavor & nutrition',
          stats: 'Peak Freshness',
          gradient: 'from-pink-500 to-rose-600',
          bgColor: 'bg-gradient-to-br from-pink-50 to-rose-50',
          borderColor: 'border-pink-200',
          shadowColor: 'shadow-pink-100'
        }
      ].map((feature, index) => (
        <div 
          key={index} 
          className="group relative"
        >
          {/* Animated Border */}
          <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500 group-hover:duration-200`}></div>
          
          {/* Main Card */}
          <div className={`relative ${feature.bgColor} p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2 border ${feature.borderColor} overflow-hidden`}>
            
            {/* Floating Icon Container */}
            <div className="relative mb-8">
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-10 rounded-2xl`}></div>
              <div className={`relative w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto`}>
                {feature.icon}
                
                {/* Icon Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 blur-xl rounded-full`}></div>
              </div>
              
              {/* Stats Badge */}
              <div className={`absolute -bottom-2 right-4 bg-gradient-to-r ${feature.gradient} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg`}>
                {feature.stats}
              </div>
            </div>
            
            {/* Content */}
            <div className="relative">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-center leading-relaxed mb-6">
                {feature.description}
              </p>
              
              {/* Feature Highlights */}
              <div className="space-y-3">
                {feature.title === '100% Organic' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>No pesticides or chemicals</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Locally sourced from trusted farms</span>
                    </div>
                  </>
                )}
                {feature.title === 'Same-Day Delivery' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Harvested fresh daily</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-orange-700">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>Direct farm-to-table delivery</span>
                    </div>
                  </>
                )}
                {feature.title === 'Award Winning' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Quality excellence awards</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Sustainability recognition</span>
                    </div>
                  </>
                )}
                {feature.title === 'Farm Fresh' && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-pink-700">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>Harvested at peak ripeness</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-pink-700">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span>Maximum flavor & nutrition</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Hover Indicator */}
            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r ${feature.gradient} rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          </div>
          
          {/* Card Number */}
          <div className={`absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-r ${feature.gradient} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg z-10`}>
            {index + 1}
          </div>
        </div>
      ))}
    </div>
    
    {/* Bottom CTA */}
    <div className="mt-20 text-center">
      <div className="inline-flex items-center gap-4 bg-white rounded-2xl shadow-lg px-8 py-4 mb-8">
        <div className="flex items-center gap-2">
          <Users className="text-orange-600" size={24} />
          <span className="text-lg font-bold text-gray-900">10,000+</span>
          <span className="text-gray-600">Happy Families</span>
        </div>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <ThumbsUp className="text-green-600" size={24} />
          <span className="text-lg font-bold text-gray-900">98%</span>
          <span className="text-gray-600">Satisfaction Rate</span>
        </div>
        <div className="h-8 w-px bg-gray-200"></div>
        <div className="flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={24} />
          <span className="text-lg font-bold text-gray-900">50+</span>
          <span className="text-gray-600">Local Farms</span>
        </div>
      </div>
      
      <a
        href="/about"
        className="group inline-flex items-center gap-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-10 py-5 rounded-2xl font-bold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-lg shadow-xl hover:shadow-2xl"
      >
        <span>Discover Our Story</span>
        <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={24} />
      </a>
    </div>
  </div>
</section>



      {/* Featured Categories */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Farm-Fresh <span className="text-green-600">Categories</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                Explore our wide range of premium quality products
              </p>
            </div>
            <a
              href="/categories"
              className="group inline-flex items-center gap-3 bg-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              View All Categories
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
            </a>
          </div>
          
          {/* Categories Grid */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories
                .filter(category => category.image)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((category) => (
                  <div 
                    key={category.id} 
                    className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200"
                  >
                    <CategoryCard category={category} />
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Categories will be available soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Featured <span className="text-orange-600">Products</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                Our most popular and best-selling items
              </p>
            </div>
            <a
              href="/products?featured=true"
              className="group inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              View All Featured
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
            </a>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Fresh <span className="text-green-600">Arrivals</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl">
                Newly added to our collection
              </p>
            </div>
            <a
              href="/products?sort=created_at&order=desc"
              className="group inline-flex items-center gap-3 bg-orange-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              View All New
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
            </a>
          </div>
          
          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 10).map((product, index) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 relative overflow-hidden"
                >
                  <ProductCard product={product} />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                      New
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-2xl mb-6">
                <Sprout size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">Check back soon for new arrivals!</p>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Banner */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-white/20 text-white px-6 py-3 rounded-full mb-8">
              <Heart size={20} />
              <span className="text-sm font-semibold">Exclusive Offer</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Subscribe & Save <span className="text-yellow-300">25%</span>
            </h2>
            
            <p className="text-2xl mb-10 text-white/95 max-w-3xl mx-auto font-normal">
              Get your favorite farm-fresh products delivered regularly. Cancel anytime, skip deliveries when you want.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="/profile/subscriptions"
                className="group inline-flex items-center justify-center bg-white text-orange-600 px-10 py-5 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-xl shadow-lg"
              >
                Start Your Subscription
                <ArrowRight className="ml-4 group-hover:translate-x-3 transition-transform duration-300" size={24} />
              </a>
              <a
                href="/subscriptions/plans"
                className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-10 py-5 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-xl"
              >
                View Plans
                <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform duration-300" size={24} />
              </a>
            </div>
            
            {/* Features */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { icon: '🔄', title: 'Flexible Schedule', desc: 'Change delivery dates' },
                { icon: '📦', title: 'Free Delivery', desc: 'On all subscription orders' },
                { icon: '🎁', title: 'Free Gifts', desc: 'Seasonal surprises included' }
              ].map((feature, index) => (
                <div key={index} className="text-white">
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                  <p className="text-white/90">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full mb-6">
              <Star size={18} className="text-amber-500" />
              <span className="text-sm font-semibold">Community Love</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              What Our <span className="text-orange-600">Farmily</span> Says
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join thousands of happy families enjoying fresh produce from our farm
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Regular Customer • 2 years',
                content: 'The quality of vegetables is exceptional! Everything arrives fresh and lasts longer than supermarket produce.',
                rating: 5,
                avatarColor: 'bg-orange-100'
              },
              {
                name: 'Michael Chen',
                role: 'Subscription User • 1 year',
                content: 'The subscription service has simplified my life. The seasonal variety keeps meals exciting!',
                rating: 5,
                avatarColor: 'bg-green-100'
              },
              {
                name: 'Priya Sharma',
                role: 'Family of 4 • 6 months',
                content: 'My kids now love vegetables! The freshness makes all the difference in taste and nutrition.',
                rating: 5,
                avatarColor: 'bg-amber-100'
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border border-gray-200"
              >
                {/* Rating */}
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={22}
                      className={`${i < testimonial.rating ? 'text-amber-500' : 'text-gray-300'} mr-1`}
                      fill={i < testimonial.rating ? "currentColor" : "none"}
                    />
                  ))}
                </div>
                
                {/* Quote */}
                <p className="text-gray-600 text-lg mb-8 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
                {/* Author */}
                <div className="flex items-center">
                  <div className={`${testimonial.avatarColor} w-14 h-14 rounded-full flex items-center justify-center text-gray-800 font-bold text-xl mr-4`}>
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{testimonial.name}</p>
                    <p className="text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl shadow-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 p-12 lg:p-16">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Ready to Taste the Difference?
                </h2>
                <p className="text-xl text-white/95 mb-8">
                  Join our community of health-conscious families enjoying farm-fresh goodness.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/products"
                    className="group inline-flex items-center justify-center bg-white text-green-700 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-lg shadow-md"
                  >
                    Start Shopping
                    <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={22} />
                  </a>
                  <a
                    href="/auth/register"
                    className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-lg"
                  >
                    Create Account
                    <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={22} />
                  </a>
                </div>
              </div>
              <div className="lg:w-1/2 relative h-64 lg:h-auto bg-gradient-to-l from-green-500/20 to-green-600/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-8xl opacity-20">
                    <Leaf size={120} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;