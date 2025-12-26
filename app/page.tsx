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
  MessageCircle, // WhatsApp icon
  ArrowUp // Scroll to top icon
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

  // Helper function to get correct image URL
  const getImageUrl = (imagePath: string | null, isMobile = false): string => {
    if (!imagePath) {
      // Fallback image if no path provided
      return isMobile 
        ? '/images/placeholder-mobile.jpg' 
        : '/images/placeholder-banner.jpg';
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Construct full URL to Laravel backend
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:8000';
    
    // Laravel storage paths typically start with 'storage/' or are relative paths
    let cleanPath = imagePath;
    
    // Remove 'storage/' prefix if it exists (it's already in the public path)
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.replace('storage/', '');
    }
    
    // Remove any leading slash
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.slice(1);
    }
    
    // Construct the final URL
    const finalUrl = `${baseUrl}/storage/${cleanPath}`;
    
    // Debug logging
    console.log('Image URL constructed:', {
      original: imagePath,
      cleaned: cleanPath,
      final: finalUrl
    });
    
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

      // Handle banners
      if (bannersRes.status === 'fulfilled') {
        let bannerData: Banner[] = [];
        const responseData = bannersRes.value.data;
        
        if (Array.isArray(responseData)) {
          bannerData = responseData;
        } else if (responseData && typeof responseData === 'object') {
          if (Array.isArray(responseData.data)) {
            bannerData = responseData.data;
          } else if (responseData.banners) {
            bannerData = responseData.banners;
          } else {
            // Try to extract banners from the response object
            bannerData = responseData as Banner[];
          }
        }
        
        // Filter active banners and sort by order
        const activeBanners = bannerData
          .filter(banner => banner.is_active === true)
          .sort((a, b) => a.order - b.order);
        
        setBanners(activeBanners);
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

      {/* Hero Banner Carousel */}
      {banners.length > 0 ? (
        <section className="relative">
          {/* Desktop Banner Carousel */}
          <div className="hidden md:block relative overflow-hidden h-[600px]">
            {banners.map((banner, index) => {
              const desktopImageUrl = getImageUrl(banner.image, false);
              
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  style={{
                    backgroundImage: `url(${desktopImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Semi-transparent overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                  
                  {/* Content */}
                  <div className="relative h-full flex items-center">
                    <div className="container mx-auto px-4 md:px-8 lg:px-16">
                      <div className="max-w-2xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-full mb-6 shadow-md">
                          <Leaf size={16} className="text-green-600" />
                          <span className="text-sm font-semibold">Farm Fresh</span>
                        </div>
                        
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
                          {banner.title}
                        </h1>
                        
                        {banner.subtitle && (
                          <p className="text-2xl md:text-3xl mb-10 text-white font-normal">
                            {banner.subtitle}
                          </p>
                        )}
                        
                        {banner.button_text && (
                          <div className="flex flex-col sm:flex-row gap-4">
                            <a
                              href={banner.button_link || '#'}
                              className="group inline-flex items-center justify-center bg-white text-orange-600 px-10 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-lg shadow-lg"
                              onClick={() => handleBannerClick(banner.id)}
                            >
                              {banner.button_text}
                              <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={22} />
                            </a>
                            <a
                              href="/categories"
                              className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-lg"
                            >
                              Explore All
                              <Sprout className="ml-3 group-hover:rotate-12 transition-transform duration-300" size={22} />
                            </a>
                          </div>
                        )}
                        
                        {/* Features */}
                        <div className="mt-12 flex flex-wrap gap-6">
                          <div className="flex items-center gap-3 text-white">
                            <CheckCircle size={20} className="text-green-400" />
                            <span className="font-medium">100% Organic</span>
                          </div>
                          <div className="flex items-center gap-3 text-white">
                            <TruckIcon size={20} className="text-orange-400" />
                            <span className="font-medium">Free Delivery</span>
                          </div>
                          <div className="flex items-center gap-3 text-white">
                            <ShieldCheck size={20} className="text-blue-400" />
                            <span className="font-medium">Quality Guaranteed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Navigation Arrows */}
            {banners.length > 1 && (
              <>
                <button
                  onClick={prevBanner}
                  className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-white text-orange-600 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
                  aria-label="Previous banner"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-6 top-1/2 transform -translate-y-1/2 bg-white text-orange-600 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
                  aria-label="Next banner"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
            
            {/* Dots Indicator */}
            {banners.length > 1 && (
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveBannerIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === activeBannerIndex 
                        ? 'bg-white scale-125 shadow-md' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mobile Banner Carousel */}
          <div className="md:hidden relative overflow-hidden h-[500px]">
            {banners.map((banner, index) => {
              const mobileImageUrl = getImageUrl(banner.mobile_image || banner.image, true);
              
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === activeBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                  style={{
                    backgroundImage: `url(${mobileImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent" />
                  
                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end pb-12 px-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white text-orange-600 px-4 py-2 rounded-full mb-4 self-start shadow-md">
                      <Leaf size={14} className="text-green-600" />
                      <span className="text-xs font-semibold">Farm Fresh</span>
                    </div>
                    
                    <h1 className="text-3xl font-bold mb-4 text-white leading-tight">
                      {banner.title}
                    </h1>
                    
                    {banner.subtitle && (
                      <p className="text-base mb-8 text-white/95 font-normal">
                        {banner.subtitle}
                      </p>
                    )}
                    
                    {banner.button_text && (
                      <a
                        href={banner.button_link || '#'}
                        className="group inline-flex items-center justify-center bg-white text-orange-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition-all duration-300 shadow-md"
                        onClick={() => handleBannerClick(banner.id)}
                      >
                        {banner.button_text}
                        <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" size={18} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Mobile Dots */}
            {banners.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                {banners.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveBannerIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === activeBannerIndex 
                        ? 'bg-white scale-125 shadow' 
                        : 'bg-white/50'
                    }`}
                    aria-label={`Go to banner ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        // Fallback if no banners
        <section className="relative bg-gradient-to-r from-orange-500 to-orange-600 text-white overflow-hidden">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 bg-white/20 text-white px-5 py-3 rounded-full mb-8">
                <Leaf size={20} className="text-green-300" />
                <span className="text-sm font-semibold">Trusted by 50,000+ Families</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                Fresh Farm Produce <br />Delivered Daily
              </h1>
              
              <p className="text-2xl md:text-3xl mb-12 text-white/95 font-normal">
                Farm-fresh vegetables, fruits, and groceries harvested at peak ripeness
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <a
                  href="/products"
                  className="group inline-flex items-center justify-center bg-white text-orange-600 px-10 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-lg shadow-lg"
                >
                  Shop Now
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={22} />
                </a>
                <a
                  href="/categories"
                  className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-lg"
                >
                  Browse Categories
                  <Sprout className="ml-3 group-hover:rotate-12 transition-transform duration-300" size={22} />
                </a>
              </div>
              
              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: '5000+', label: 'Products' },
                  { value: '200+', label: 'Local Farms' },
                  { value: '50K+', label: 'Happy Customers' },
                  { value: '24/7', label: 'Delivery' }
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold mb-2 text-white">{stat.value}</div>
                    <div className="text-sm text-white/90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Wave SVG */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <path fill="#ffffff" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,112C672,96,768,96,864,122.7C960,149,1056,203,1152,213.3C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Why Choose <span className="text-orange-600">Lando Ranch</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We bring the farm to your table with care, quality, and convenience
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Leaf className="text-green-600" size={40} />,
                title: '100% Organic',
                description: 'Chemical-free produce from trusted local farms',
                color: 'bg-green-50',
                borderColor: 'border-green-100'
              },
              {
                icon: <Truck className="text-orange-600" size={40} />,
                title: 'Same-Day Delivery',
                description: 'Fresh deliveries within hours of harvest',
                color: 'bg-orange-50',
                borderColor: 'border-orange-100'
              },
              {
                icon: <Award className="text-amber-600" size={40} />,
                title: 'Award Winning',
                description: 'Recognized for quality and sustainability',
                color: 'bg-amber-50',
                borderColor: 'border-amber-100'
              },
              {
                icon: <Heart className="text-red-500" size={40} />,
                title: 'Farm Fresh',
                description: 'Harvested at peak ripeness for best flavor',
                color: 'bg-red-50',
                borderColor: 'border-red-100'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`${feature.color} p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border ${feature.borderColor}`}
              >
                <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center mb-6 mx-auto shadow-sm">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories - 4 PER ROW */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <div className="inline-flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-full mb-4 shadow-sm border border-gray-200">
                <Sprout size={18} className="text-green-600" />
                <span className="text-sm font-semibold">Browse Collections</span>
              </div>
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
          
          {/* Categories Grid - 4 PER ROW */}
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <Sprout size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">Categories will be available soon</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products - UPDATED TO 4 PER ROW */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <div className="inline-flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-full mb-4 shadow-sm border border-gray-200">
                <Star size={18} className="text-amber-500" />
                <span className="text-sm font-semibold">Customer Favorites</span>
              </div>
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
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 relative overflow-hidden"
                >
                  <ProductCard product={product} />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                      Featured
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-2xl mb-6">
                <Package size={48} className="text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No featured products available at the moment</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals - UPDATED TO 4 PER ROW */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <div className="inline-flex items-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-full mb-4 shadow-sm border border-gray-200">
                <TrendingUp size={18} className="text-green-600" />
                <span className="text-sm font-semibold">Just In Stock</span>
              </div>
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