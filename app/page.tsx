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
  ArrowUp,
  HelpCircle,
  Bot,
  Phone,
  Sparkles,
  Percent,
  Target,
  TrendingDown,
  Zap,
  Clock as ClockIcon,
  Gift,
  Crown,
  Calendar,
  ShoppingCart,
  User,
  Filter,
  Clock3
} from 'lucide-react';
import Link from 'next/link';

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
  image_url?: string;
  mobile_image_url?: string;
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

interface PersonalizedOffer {
  id: number;
  user_id: number;
  product_id: number;
  offer_name: string;
  original_price: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discounted_price: number;
  status: 'active' | 'used' | 'expired';
  valid_until: string;
  applied_rules: any;
  metadata: any;
  created_at: string;
  updated_at: string;
  product?: Product;
}

interface UserPreferences {
  id: number;
  user_id: number;
  preferred_price_min: number | null;
  preferred_price_max: number | null;
  preferred_categories: number[] | null;
  interaction_count: number;
  preferences_updated_at: string | null;
}

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  // New personalized features state
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<Product[]>([]);
  const [personalizedOffers, setPersonalizedOffers] = useState<PersonalizedOffer[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isPersonalizationLoading, setIsPersonalizationLoading] = useState(false);
  const [showPersonalizedSection, setShowPersonalizedSection] = useState(false);

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

  // Get banner image URL
  const getBannerImageUrl = (banner: Banner, isMobile = false): string => {
    const imagePath = isMobile ? banner.mobile_image || banner.image : banner.image;
    
    if (!imagePath) {
      return '/default-banner.jpg';
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    let cleanPath = imagePath;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.replace('storage/', '');
    }
    
    const baseUrl = 'https://api.hypermarket.co.ke';
    const finalUrl = `${baseUrl}/storage/${cleanPath}`;
    
    return finalUrl;
  };

  // Load personalized data for authenticated users
  const loadPersonalizedData = async () => {
    try {
      setIsPersonalizationLoading(true);
      
      // Check if user is authenticated
      const user = await api.auth.getCurrentUser();
      
      if (user && user.data) {
        setShowPersonalizedSection(true);
        
        // Load personalized recommendations
        try {
          const recommendationsRes = await api.products.getPersonalizedRecommendations({ limit: 8 });
          if (recommendationsRes.data?.recommendations) {
            setPersonalizedRecommendations(recommendationsRes.data.recommendations);
          }
        } catch (error) {
          console.error('Failed to load personalized recommendations:', error);
        }
        
        // Load personalized offers
        try {
          const offersRes = await api.products.getPersonalizedOffers();
          if (offersRes.data?.offers?.data) {
            setPersonalizedOffers(offersRes.data.offers.data);
          }
        } catch (error) {
          console.error('Failed to load personalized offers:', error);
        }
        
        // Load user preferences
        try {
          const preferencesRes = await api.products.getUserPreferences();
          if (preferencesRes.data?.preferences) {
            setUserPreferences(preferencesRes.data.preferences);
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
      }
    } catch (error) {
      console.error('Error loading personalized data:', error);
      setShowPersonalizedSection(false);
    } finally {
      setIsPersonalizationLoading(false);
    }
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
        const response = bannersRes.value;
        console.log('Banners API response:', response);
        
        let bannerData: Banner[] = [];
        
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
      
      // Load personalized data after main content
      loadPersonalizedData();
      
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

  // Handle product view tracking
  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  // Handle offer interaction tracking
  const trackOfferInteraction = async (offerId: number | string, interactionType: string) => {
    try {
      await api.products.trackOfferInteraction({
        offer_id: offerId,
        offer_type: 'personalized_offer',
        interaction_type: interactionType
      });
    } catch (error) {
      console.error('Failed to track offer interaction:', error);
    }
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get time until offer expires
  const getTimeUntilExpiry = (validUntil: string) => {
    const expiryDate = new Date(validUntil);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `${diffHours} hr`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  };

  // Calculate user profile completion percentage
  const calculateProfileCompletion = () => {
    if (!userPreferences) return 0;
    
    let completedFields = 0;
    const totalFields = 3; // price_min, price_max, categories
    
    if (userPreferences.preferred_price_min) completedFields++;
    if (userPreferences.preferred_price_max) completedFields++;
    if (userPreferences.preferred_categories && userPreferences.preferred_categories.length > 0) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
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
      {/* Floating Customer Support Buttons */}
      <div className="fixed right-6 z-50 flex flex-col gap-4" style={{ bottom: '40px' }}>
        {/* Customer Support Button */}
        <div className="relative">
          <button
            onClick={() => setShowCustomerSupport(!showCustomerSupport)}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110 hover:shadow-xl"
            aria-label="Customer Support"
          >
            <HelpCircle size={28} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
              <span className="inline-block">?</span>
            </span>
          </button>
          
          {/* Support Options Dropdown */}
          {showCustomerSupport && (
            <div className="absolute right-0 bottom-full mb-4 bg-white rounded-xl shadow-2xl border border-gray-200 min-w-64 overflow-hidden animate-slide-up">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <h3 className="font-bold text-lg">Customer Support</h3>
                <p className="text-sm opacity-90">We're here to help!</p>
              </div>
              
              <div className="p-3 space-y-2">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Open chat support');
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <MessageCircle size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Chat Support</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Bot size={12} />
                      Live chat or chatbot
                    </div>
                  </div>
                </a>
                
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                >
                  <div className="bg-green-100 p-2 rounded-lg group-hover:bg-green-200 transition-colors">
                    <MessageCircle size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">WhatsApp</div>
                    <div className="text-xs text-gray-500">Instant messaging support</div>
                  </div>
                </a>
                
                <a
                  href="tel:+254716354589"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                >
                  <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Phone size={20} className="text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Call Support</div>
                    <div className="text-xs text-gray-500">+254 716 354 589</div>
                  </div>
                </a>
                
                <a
                  href="/help"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                >
                  <div className="bg-purple-100 p-2 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <HelpCircle size={20} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Help Center</div>
                    <div className="text-xs text-gray-500">FAQs & guides</div>
                  </div>
                </a>
              </div>
              
              <div className="border-t border-gray-100 p-3 bg-gray-50">
                <div className="text-xs text-gray-500 text-center">
                  Typically replies in 2 minutes
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 hover:shadow-xl"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={28} />
        </a>
        
        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`bg-orange-500 text-white p-4 rounded-full shadow-lg hover:bg-orange-600 transition-all duration-300 hover:scale-110 hover:shadow-xl ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
          aria-label="Scroll to top"
        >
          <ArrowUp size={28} />
        </button>
      </div>

      {/* Banner Section */}
      <section className="relative">
        {banners.length > 0 ? (
          <>
            {/* Desktop Banner */}
            <div className="hidden md:block relative h-[450px] overflow-hidden">
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
            
            {/* Mobile Banner */}
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
          // Fallback if no banners
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

      {/* Personalized Recommendations Section */}
      {showPersonalizedSection && (
        <section className="py-16 bg-gradient-to-br from-purple-50 via-white to-blue-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
              <div className="mb-8 lg:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-xl">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Just For You
                    </span>
                  </h2>
                </div>
                <p className="text-xl text-gray-600 max-w-2xl">
                  AI-powered recommendations based on your shopping preferences
                </p>
                
                {/* Profile Completion */}
                {userPreferences && (
                  <div className="mt-6 flex items-center gap-4">
                    <div className="w-48 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculateProfileCompletion()}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      Profile: {calculateProfileCompletion()}% complete
                    </span>
                    {calculateProfileCompletion() < 100 && (
                      <Link 
                        href="/profile/preferences" 
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                      >
                        <User size={14} />
                        Update preferences
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <Link
                  href="/profile/recommendations"
                  className="group inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  View All Recommendations
                  <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
                </Link>
              </div>
            </div>
            
            {isPersonalizationLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : personalizedRecommendations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {personalizedRecommendations.map((product) => (
                    <div 
                      key={product.id} 
                      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200 relative overflow-hidden group"
                    >
                      {/* AI Recommendation Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                          <Sparkles size={12} />
                          <span>AI Recommended</span>
                        </div>
                      </div>
                      
                      {/* Personalization Score */}
                      {product.relevance_score && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                            <Target size={12} />
                            <span>{Math.round(product.relevance_score)}% Match</span>
                          </div>
                        </div>
                      )}
                      
                      <div onClick={() => trackProductView(product.id)}>
                        <ProductCard product={product} showPersonalizedPrice={true} />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Recommendation Explanation */}
                <div className="mt-12 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl">
                      <Bot size={24} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">How these recommendations work</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        icon: <TrendingUp className="text-green-600" size={20} />,
                        title: 'Purchase History',
                        description: 'Based on what you\'ve bought before'
                      },
                      {
                        icon: <ShoppingBag className="text-blue-600" size={20} />,
                        title: 'Shopping Behavior',
                        description: 'Your browsing and view patterns'
                      },
                      {
                        icon: <Heart className="text-pink-600" size={20} />,
                        title: 'User Preferences',
                        description: 'Your saved preferences and likes'
                      },
                      {
                        icon: <Users className="text-purple-600" size={20} />,
                        title: 'Similar Shoppers',
                        description: 'What people like you are buying'
                      }
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="bg-gray-100 p-3 rounded-xl">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl mb-6">
                  <Sparkles size={40} className="text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Personalize Your Experience
                </h3>
                <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                  Sign in and update your preferences to get AI-powered recommendations tailored just for you
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/profile/preferences"
                    className="inline-flex items-center justify-center bg-white text-purple-600 border border-purple-600 px-8 py-3 rounded-xl font-bold hover:bg-purple-50 transition-all duration-300"
                  >
                    Set Preferences
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Personalized Offers Section */}
      {showPersonalizedSection && personalizedOffers.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-orange-50 via-white to-yellow-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
              <div className="mb-8 lg:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-xl">
                    <Percent size={24} className="text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Your Exclusive Offers
                    </span>
                  </h2>
                </div>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Special deals and discounts tailored just for you
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPrice(personalizedOffers.reduce((total, offer) => 
                    total + (offer.original_price - offer.discounted_price), 0
                  ))}
                </div>
                <p className="text-gray-600">Total potential savings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {personalizedOffers.slice(0, 6).map((offer) => (
                <div 
                  key={offer.id}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
                  onClick={() => trackOfferInteraction(offer.id, 'click')}
                >
                  {/* Offer Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Crown size={24} className="text-white" />
                        <h3 className="text-xl font-bold text-white">{offer.offer_name}</h3>
                      </div>
                      <div className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full">
                        {getTimeUntilExpiry(offer.valid_until)}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center gap-4">
                      <div className="text-white">
                        <div className="text-sm opacity-90">Discount</div>
                        <div className="text-3xl font-bold">
                          {offer.discount_type === 'percentage' 
                            ? `${offer.discount_value}% OFF`
                            : `${formatPrice(offer.discount_value)} OFF`
                          }
                        </div>
                      </div>
                      
                      <div className="h-12 w-px bg-white/30" />
                      
                      <div className="text-white">
                        <div className="text-sm opacity-90">You Save</div>
                        <div className="text-3xl font-bold">
                          {formatPrice(offer.original_price - offer.discounted_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    {offer.product && (
                      <>
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                            <img 
                              src={offer.product.thumbnail_url || '/default-product.jpg'}
                              alt={offer.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-2">{offer.product.name}</h4>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="text-sm text-gray-500 line-through">
                                  {formatPrice(offer.original_price)}
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                  {formatPrice(offer.discounted_price)}
                                </div>
                              </div>
                              <div className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                                Save {calculateDiscountPercentage(offer.original_price, offer.discounted_price)}%
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Rules Applied */}
                        {offer.applied_rules && typeof offer.applied_rules === 'object' && (
                          <div className="mb-6">
                            <div className="text-sm font-medium text-gray-900 mb-2">Why you got this offer:</div>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(offer.applied_rules).map(([key, value]: [string, any]) => (
                                <div 
                                  key={key}
                                  className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full"
                                >
                                  {key.replace(/_/g, ' ')}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <Link
                          href={`/products/${offer.product_id}`}
                          className="block w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-center py-4 rounded-xl font-bold hover:shadow-lg transition-all duration-300 group-hover:from-green-600 group-hover:to-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackOfferInteraction(offer.id, 'click');
                          }}
                        >
                          Claim Your Offer
                          <ArrowRight className="inline ml-2 group-hover:translate-x-1 transition-transform duration-300" size={18} />
                        </Link>
                      </>
                    )}
                  </div>
                  
                  {/* Offer Type Indicator */}
                  <div className="px-6 pb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <ClockIcon size={14} />
                        <span>Expires {new Date(offer.valid_until).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          offer.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-gray-600 capitalize">{offer.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {personalizedOffers.length > 6 && (
              <div className="text-center mt-12">
                <Link
                  href="/profile/offers"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300"
                >
                  View All Offers ({personalizedOffers.length})
                  <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
                </Link>
              </div>
            )}
            
            {/* Offer Types Explanation */}
            <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                How We Create Your Personalized Offers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: <Crown className="text-yellow-600" size={24} />,
                    title: 'Loyalty Rewards',
                    description: 'Special discounts for our regular customers',
                    color: 'from-yellow-100 to-yellow-50'
                  },
                  {
                    icon: <TrendingDown className="text-green-600" size={24} />,
                    title: 'Dynamic Pricing',
                    description: 'Personalized prices based on your shopping patterns',
                    color: 'from-green-100 to-green-50'
                  },
                  {
                    icon: <Calendar className="text-blue-600" size={24} />,
                    title: 'Seasonal Deals',
                    description: 'Timely offers based on seasons and events',
                    color: 'from-blue-100 to-blue-50'
                  },
                  {
                    icon: <Zap className="text-purple-600" size={24} />,
                    title: 'Real-time Offers',
                    description: 'Context-aware deals as you browse',
                    color: 'from-purple-100 to-purple-50'
                  }
                ].map((item, index) => (
                  <div 
                    key={index} 
                    className={`bg-gradient-to-br ${item.color} p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="bg-white p-3 rounded-xl w-fit mb-4">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-5 bg-gradient-to-br from-white via-orange-50/20 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 relative">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">
                Why Lando Hypermarket
              </span>
            </h2>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Experience the difference with farm-fresh produce delivered with care, quality, and convenience
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative group">
              <div className="absolute -inset-6 bg-gradient-to-r from-orange-400/20 via-green-400/20 to-orange-400/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src="/lando.png" 
                    alt="Lando Ranch - Premium Organic Farming" 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-6 right-6">
                    <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-orange-500" />
                        <span className="text-sm font-bold text-gray-800">Est. 2015</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-6 left-6">
                    <div className="bg-black/40 backdrop-blur-sm px-4 py-3 rounded-2xl">
                      <div className="text-white">
                        <div className="text-sm font-medium opacity-90 mb-1">PREMIUM ORGANIC</div>
                        <div className="text-3xl font-bold tracking-tight">Lando Hypermarket</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-6 border border-gray-200/50 backdrop-blur-sm">
                <div className="text-center">
                  <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent">10K+</div>
                  <div className="text-sm text-gray-600 font-medium">Happy Families</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: <Leaf size={24} className="text-green-600" />,
                  title: 'Certified Organic',
                  description: '100% natural produce without chemicals or pesticides',
                  gradient: 'from-green-500 to-emerald-600',
                  stats: '100% Natural',
                  index: '01'
                },
                {
                  icon: <Truck size={24} className="text-orange-600" />,
                  title: 'Same-Day Fresh',
                  description: 'Harvested in morning, delivered fresh by evening',
                  gradient: 'from-orange-500 to-amber-600',
                  stats: '24h Delivery',
                  index: '02'
                },
                {
                  icon: <Shield size={24} className="text-blue-600" />,
                  title: 'Quality Guaranteed',
                  description: 'Every product inspected for premium quality',
                  gradient: 'from-blue-500 to-cyan-600',
                  stats: 'Premium Quality',
                  index: '03'
                },
                {
                  icon: <Heart size={24} className="text-rose-600" />,
                  title: 'Farm to Family',
                  description: 'Supporting local farmers, feeding local families',
                  gradient: 'from-rose-500 to-pink-600',
                  stats: 'Local Community',
                  index: '04'
                }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="group relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:border-transparent"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
                  
                  <div className="relative flex items-start gap-4">
                    <div className={`relative flex-shrink-0`}>
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-20 rounded-xl blur-md group-hover:blur-lg transition-all duration-500`}></div>
                      <div className="relative w-14 h-14 rounded-xl bg-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        {feature.icon}
                      </div>
                      
                      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 text-white text-xs font-bold flex items-center justify-center">
                        {feature.index}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-950 transition-colors">
                          {feature.title}
                        </h3>
                        <span className={`text-xs font-bold bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                          {feature.stats}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-3/4 h-0.5 bg-gradient-to-r ${feature.gradient} rounded-full transition-all duration-500`}></div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/5 via-green-400/5 to-orange-400/5 rounded-3xl blur-xl"></div>
            
            <div className="relative bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { value: '10,000+', label: 'Happy Families', color: 'text-orange-600' },
                  { value: '98%', label: 'Satisfaction Rate', color: 'text-green-600' },
                  { value: '50+', label: 'Local Farms', color: 'text-blue-600' },
                  { value: '24h', label: 'Fresh Delivery', color: 'text-purple-600' }
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2 group-hover:scale-110 transition-transform duration-300`}>
                      {stat.value}
                    </div>
                    <div className="text-gray-600 font-medium text-sm">
                      {stat.label}
                    </div>
                    <div className="mt-2">
                      <div className={`w-8 h-1 mx-auto bg-gradient-to-r ${stat.color.includes('orange') ? 'from-orange-500 to-orange-600' : 
                        stat.color.includes('green') ? 'from-green-500 to-green-600' :
                        stat.color.includes('blue') ? 'from-blue-500 to-blue-600' :
                        'from-purple-500 to-purple-600'} rounded-full group-hover:w-12 transition-all duration-300`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <a
              href="/products"
              className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-orange-500 to-green-500 text-white px-10 py-4 rounded-2xl font-bold hover:shadow-2xl transition-all duration-500 hover:scale-105 shadow-lg overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              
              <span className="relative">Shop Fresh Now</span>
              <ArrowRight className="relative group-hover:translate-x-2 transition-transform duration-300" size={22} />
            </a>
            
            <p className="mt-4 text-sm text-gray-500">
              Free delivery on orders over Ksh 3,000 • Quality guaranteed
            </p>
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

      {/* Real-time Offers Section */}
      {showPersonalizedSection && (
        <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 bg-white/20 text-white px-6 py-3 rounded-full mb-8">
                <Zap size={20} />
                <span className="text-sm font-semibold">Real-time Personalization</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Your <span className="text-yellow-300">Smart</span> Shopping Experience
              </h2>
              
              <p className="text-2xl mb-10 text-white/95 max-w-3xl mx-auto font-normal">
                Our AI learns from your shopping behavior to deliver personalized prices, recommendations, and offers in real-time.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                  {
                    icon: <Target className="text-blue-400" size={32} />,
                    title: 'Personalized Pricing',
                    description: 'Dynamic prices based on your shopping patterns and preferences'
                  },
                  {
                    icon: <Sparkles className="text-purple-400" size={32} />,
                    title: 'Smart Recommendations',
                    description: 'AI-powered suggestions tailored just for you'
                  },
                  {
                    icon: <Clock3 className="text-green-400" size={32} />,
                    title: 'Real-time Offers',
                    description: 'Context-aware deals as you browse the site'
                  }
                ].map((feature, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                    <div className="mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-white/90">{feature.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/profile/preferences"
                  className="group inline-flex items-center justify-center bg-white text-blue-600 px-10 py-5 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 text-xl shadow-lg"
                >
                  Customize Your Experience
                  <ArrowRight className="ml-4 group-hover:translate-x-3 transition-transform duration-300" size={24} />
                </Link>
                <Link
                  href="/profile/shopping-analytics"
                  className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-10 py-5 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-xl"
                >
                  View Your Analytics
                  <ArrowRight className="ml-4 group-hover:translate-x-2 transition-transform duration-300" size={24} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

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