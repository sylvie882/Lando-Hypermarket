'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Clock3,
  BarChart3,
  Bell,
  ShoppingBasket,
  TrendingUp as TrendingUpIcon,
  Eye
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

interface ShoppingAnalytics {
  purchase_history: any[];
  viewing_history: any[];
  wishlist: any[];
  statistics: {
    total_spent: number;
    total_orders: number;
    completed_orders: number;
    order_completion_rate: number;
    average_order_value: number;
  };
  preferences: UserPreferences;
  active_offers: PersonalizedOffer[];
  interaction_count: number;
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
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [preloadedImages, setPreloadedImages] = useState<Set<number>>(new Set());
  
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<Product[]>([]);
  const [personalizedOffers, setPersonalizedOffers] = useState<PersonalizedOffer[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [shoppingAnalytics, setShoppingAnalytics] = useState<ShoppingAnalytics | null>(null);
  const [isPersonalizationLoading, setIsPersonalizationLoading] = useState(false);
  const [showPersonalizedSection, setShowPersonalizedSection] = useState(false);
  const [realTimeOffers, setRealTimeOffers] = useState<PersonalizedOffer[]>([]);
  const [isRealTimeOffersLoading, setIsRealTimeOffersLoading] = useState(false);

  const [visibleBanners, setVisibleBanners] = useState<Banner[]>([]);
  const [displayCount, setDisplayCount] = useState(5);

  const whatsappNumber = '+254716354589';
  const whatsappMessage = encodeURIComponent('Hello! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getBannerImageUrl = useCallback((banner: Banner, isMobile = false): string => {
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
    
    const params = new URLSearchParams({
      width: isMobile ? '800' : '1920',
      quality: '75',
      format: 'auto'
    });
    
    return `${baseUrl}/storage/${cleanPath}?${params}`;
  }, []);

  const preloadBannerImage = useCallback((bannerId: number, banner: Banner, isMobile: boolean) => {
    if (preloadedImages.has(bannerId)) return;
    
    const img = new Image();
    const imageUrl = getBannerImageUrl(banner, isMobile);
    
    img.onload = () => {
      setPreloadedImages(prev => new Set(prev).add(bannerId));
    };
    
    img.onerror = () => {
      console.error(`Failed to preload banner ${bannerId}`);
    };
    
    img.src = imageUrl;
  }, [getBannerImageUrl, preloadedImages]);

  const nextBanner = useCallback(() => {
    if (banners.length <= 1) return;
    
    const nextIndex = activeBannerIndex === banners.length - 1 ? 0 : activeBannerIndex + 1;
    
    if (banners[nextIndex]) {
      preloadBannerImage(banners[nextIndex].id, banners[nextIndex], false);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        preloadBannerImage(banners[nextIndex].id, banners[nextIndex], true);
      }
    }
    
    const nextAfterNext = nextIndex === banners.length - 1 ? 0 : nextIndex + 1;
    if (banners[nextAfterNext]) {
      preloadBannerImage(banners[nextAfterNext].id, banners[nextAfterNext], false);
    }
    
    setActiveBannerIndex(nextIndex);
  }, [activeBannerIndex, banners, preloadBannerImage]);

  const prevBanner = useCallback(() => {
    if (banners.length <= 1) return;
    
    const prevIndex = activeBannerIndex === 0 ? banners.length - 1 : activeBannerIndex - 1;
    
    if (banners[prevIndex]) {
      preloadBannerImage(banners[prevIndex].id, banners[prevIndex], false);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        preloadBannerImage(banners[prevIndex].id, banners[prevIndex], true);
      }
    }
    
    setActiveBannerIndex(prevIndex);
  }, [activeBannerIndex, banners, preloadBannerImage]);

  const loadPersonalizedData = async () => {
    try {
      setIsPersonalizationLoading(true);
      
      const user = await api.auth.getCurrentUser();
      
      if (user && user.data) {
        setShowPersonalizedSection(true);
        
        try {
          const recommendationsRes = await api.products.getPersonalizedRecommendations({ limit: 12 });
          if (recommendationsRes.data?.success && recommendationsRes.data.recommendations) {
            setPersonalizedRecommendations(recommendationsRes.data.recommendations);
          }
        } catch (error) {
          console.error('Failed to load personalized recommendations:', error);
        }
        
        try {
          const offersRes = await api.products.getPersonalizedOffers();
          if (offersRes.data?.success && offersRes.data.offers?.data) {
            setPersonalizedOffers(offersRes.data.offers.data);
          }
        } catch (error) {
          console.error('Failed to load personalized offers:', error);
        }
        
        try {
          const preferencesRes = await api.products.getUserPreferences();
          if (preferencesRes.data?.success && preferencesRes.data.preferences) {
            setUserPreferences(preferencesRes.data.preferences);
          }
        } catch (error) {
          console.error('Failed to load user preferences:', error);
        }
        
        try {
          const analyticsRes = await api.products.getShoppingAnalytics();
          if (analyticsRes.data?.success && analyticsRes.data.analytics) {
            setShoppingAnalytics(analyticsRes.data.analytics);
          }
        } catch (error) {
          console.error('Failed to load shopping analytics:', error);
        }
        
        // Load real-time offers for featured products
        if (featuredProducts.length > 0) {
          loadRealTimeOffers();
        }
      } else {
        setShowPersonalizedSection(false);
      }
    } catch (error) {
      console.error('Error loading personalized data:', error);
      setShowPersonalizedSection(false);
    } finally {
      setIsPersonalizationLoading(false);
    }
  };

  const loadRealTimeOffers = async () => {
    try {
      setIsRealTimeOffersLoading(true);
      const offers: PersonalizedOffer[] = [];
      
      // Get real-time offers for first 3 featured products
      for (const product of featuredProducts.slice(0, 3)) {
        try {
          const res = await api.products.getRealTimeOffers({ 
            product_id: product.id,
            category_id: product.category_id 
          });
          if (res.data?.success && res.data.offers) {
            offers.push(...res.data.offers);
          }
        } catch (error) {
          console.error(`Failed to get real-time offers for product ${product.id}:`, error);
        }
      }
      
      setRealTimeOffers(offers);
    } catch (error) {
      console.error('Failed to load real-time offers:', error);
    } finally {
      setIsRealTimeOffersLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length > 0) {
      const initialBanners = banners.slice(0, displayCount);
      setVisibleBanners(initialBanners);
      
      initialBanners.slice(0, 2).forEach(banner => {
        preloadBannerImage(banner.id, banner, false);
        preloadBannerImage(banner.id, banner, true);
      });
      
      const interval = setInterval(nextBanner, 5000);
      return () => clearInterval(interval);
    }
  }, [banners, displayCount, preloadBannerImage, nextBanner]);

  const loadMoreBanners = useCallback(() => {
    if (banners.length > displayCount) {
      const nextDisplayCount = Math.min(displayCount + 3, banners.length);
      setDisplayCount(nextDisplayCount);
      setVisibleBanners(banners.slice(0, nextDisplayCount));
      
      banners.slice(displayCount, nextDisplayCount).forEach(banner => {
        preloadBannerImage(banner.id, banner, false);
        preloadBannerImage(banner.id, banner, true);
      });
    }
  }, [banners, displayCount, preloadedImages]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      const [featuredRes, categoriesRes, bannersRes] = await Promise.allSettled([
        api.products.getFeatured(),
        api.categories.getAll(),
        api.banners.getHomepage()
      ]);

      if (featuredRes.status === 'fulfilled') {
        setFeaturedProducts(featuredRes.value.data || []);
      } else {
        console.error('Failed to fetch featured products:', featuredRes.reason);
      }

      if (categoriesRes.status === 'fulfilled') {
        const categoriesData = categoriesRes.value.data || [];
        setCategories(categoriesData);
      } else {
        console.error('Failed to fetch categories:', categoriesRes.reason);
      }

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
        
        const activeBanners = bannerData
          .filter(banner => {
            const isActive = banner.is_active === true;
            const isHomepage = banner.type === 'homepage';
            const hasImage = banner.image || banner.image_url;
            return isActive && isHomepage && hasImage;
          })
          .sort((a, b) => a.order - b.order)
          .slice(0, 10);
        
        console.log(`Found ${activeBanners.length} active banners (limited to 10)`);
        setBanners(activeBanners);
      } else {
        console.error('Failed to fetch banners:', bannersRes.reason);
      }

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
      
      // Load personalized data after initial data is loaded
      await loadPersonalizedData();
    } catch (error) {
      console.error('Failed to fetch homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBannerClick = async (bannerId: number) => {
    try {
      await api.banners.trackClick(bannerId);
    } catch (error) {
      console.error('Failed to track banner click:', error);
    }
  };

  const handleImageError = useCallback((bannerId: number) => {
    console.error(`Banner ${bannerId} image failed to load`);
    setImageErrors(prev => new Set(prev).add(bannerId));
  }, []);

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

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

  const calculateDiscountPercentage = (originalPrice: number, discountedPrice: number) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

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

  const calculateProfileCompletion = () => {
    if (!userPreferences) return 0;
    
    let completedFields = 0;
    const totalFields = 3;
    
    if (userPreferences.preferred_price_min) completedFields++;
    if (userPreferences.preferred_price_max) completedFields++;
    if (userPreferences.preferred_categories && userPreferences.preferred_categories.length > 0) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  const BannerImage = React.memo(({ 
    banner, 
    isMobile, 
    isActive 
  }: { 
    banner: Banner; 
    isMobile: boolean; 
    isActive: boolean;
  }) => {
    const imageUrl = useMemo(() => getBannerImageUrl(banner, isMobile), [banner, isMobile]);
    const hasError = imageErrors.has(banner.id);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      if (isActive && !isLoaded && !hasError) {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          setIsLoaded(true);
          setLoadedImages(prev => new Set(prev).add(banner.id));
        };
        img.onerror = () => handleImageError(banner.id);
      }
    }, [isActive, imageUrl, banner.id, isLoaded, hasError, handleImageError]);

    return (
      <>
        {hasError ? (
          <div className={`absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center ${!isActive ? 'hidden' : ''}`}>
            <div className="text-center text-white p-8">
              <h2 className="text-3xl font-bold mb-4">{banner.title}</h2>
              <p className="text-xl">Image failed to load</p>
            </div>
          </div>
        ) : (
          <>
            {(isLoaded || preloadedImages.has(banner.id)) && (
              <img
                src={imageUrl}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={isActive ? "eager" : "lazy"}
                onError={() => handleImageError(banner.id)}
                onLoad={() => console.log(`✅ Banner ${banner.id} loaded`)}
              />
            )}
          </>
        )}
      </>
    );
  });

  BannerImage.displayName = 'BannerImage';

  const MobileBannerItem = React.memo(({ 
    banner, 
    index 
  }: { 
    banner: Banner; 
    index: number;
  }) => {
    const isActive = index === activeBannerIndex;
    const imageUrl = useMemo(() => getBannerImageUrl(banner, true), [banner]);
    const hasError = imageErrors.has(banner.id);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      if (isActive && !isLoaded && !hasError) {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => setIsLoaded(true);
        img.onerror = () => handleImageError(banner.id);
      }
    }, [isActive, imageUrl, banner.id, isLoaded, hasError]);

    return (
      <div
        key={banner.id}
        className={`absolute inset-0 transition-opacity duration-700 ${
          isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
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
            {(isLoaded || preloadedImages.has(banner.id)) && (
              <img
                src={imageUrl}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading={isActive ? "eager" : "lazy"}
                onError={() => handleImageError(banner.id)}
              />
            )}
            
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
  });

  MobileBannerItem.displayName = 'MobileBannerItem';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Customer Support Floating Buttons */}
      <div className="fixed right-6 z-50 flex flex-col gap-4" style={{ bottom: '40px' }}>
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
        
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 hover:shadow-xl"
          aria-label="Chat on WhatsApp"
        >
          <MessageCircle size={28} />
        </a>
        
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

      {/* Banners Section */}
      <section className="relative">
        {banners.length > 0 ? (
          <>
            <div className="hidden md:block relative h-[450px] overflow-hidden">
              {banners.map((banner, index) => {
                const isActive = index === activeBannerIndex;
                
                return (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <BannerImage 
                      banner={banner} 
                      isMobile={false} 
                      isActive={isActive}
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
                  </div>
                );
              })}
              
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
              
              {banners.length > visibleBanners.length && (
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    onClick={loadMoreBanners}
                    className="bg-white/80 backdrop-blur-sm text-gray-800 text-sm font-medium px-3 py-1.5 rounded-full hover:bg-white transition-all duration-300"
                  >
                    Load more banners ({banners.length - visibleBanners.length} more)
                  </button>
                </div>
              )}
            </div>
            
            <div className="md:hidden relative h-[300px] overflow-hidden">
              {banners.map((banner, index) => (
                <MobileBannerItem 
                  key={banner.id}
                  banner={banner}
                  index={index}
                />
              ))}
              
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
                  AI-powered recommendations based on your shopping behavior and preferences
                </p>
                
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
                      onClick={() => trackProductView(product.id)}
                    >
                      <div className="absolute top-3 left-3 z-10">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1">
                          <Sparkles size={12} />
                          <span>AI Recommended</span>
                        </div>
                      </div>
                      
                      {product.relevance_score && (
                        <div className="absolute top-3 right-3 z-10">
                          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                            <Target size={12} />
                            <span>{Math.round(product.relevance_score)}% Match</span>
                          </div>
                        </div>
                      )}
                      
                      <div onClick={() => trackProductView(product.id)}>
                        <ProductCard 
                          product={product} 
                          showPersonalizedPrice={true}
                          onViewTrack={() => trackProductView(product.id)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
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
                  
                  <div className="p-6">
                    {offer.product && (
                      <>
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                            <img 
                              src={offer.product.thumbnail_url || '/default-product.jpg'}
                              alt={offer.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/default-product.jpg';
                              }}
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

      {/* Shopping Analytics Dashboard */}
      {showPersonalizedSection && shoppingAnalytics && (
        <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
              <div className="mb-8 lg:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-xl">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Your Shopping Dashboard
                    </span>
                  </h2>
                </div>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Track your shopping habits, savings, and preferences
                </p>
              </div>
              
              <Link
                href="/profile/shopping-analytics"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                View Full Analytics
                <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <ShoppingBasket className="text-green-600" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {shoppingAnalytics.statistics.total_orders}
                    </div>
                    <div className="text-sm text-gray-600">Total Orders</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {shoppingAnalytics.statistics.completed_orders} completed
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <TrendingUpIcon className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {formatPrice(shoppingAnalytics.statistics.total_spent)}
                    </div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Avg: {formatPrice(shoppingAnalytics.statistics.average_order_value)}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-3 rounded-xl">
                    <Eye className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {shoppingAnalytics.interaction_count}
                    </div>
                    <div className="text-sm text-gray-600">Interactions</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Views, clicks, and purchases
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <Bell className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {personalizedOffers.length}
                    </div>
                    <div className="text-sm text-gray-600">Active Offers</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Personalized deals for you
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  href="/profile/preferences"
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 group"
                >
                  <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <User className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Update Preferences</div>
                    <div className="text-sm text-gray-600">Customize your shopping experience</div>
                  </div>
                </Link>
                
                <Link
                  href="/profile/recommendations"
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 group"
                >
                  <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Sparkles className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">View Recommendations</div>
                    <div className="text-sm text-gray-600">See more personalized suggestions</div>
                  </div>
                </Link>
                
                <Link
                  href="/profile/offers"
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 group"
                >
                  <div className="bg-orange-100 p-3 rounded-lg group-hover:bg-orange-200 transition-colors">
                    <Gift className="text-orange-600" size={24} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Manage Offers</div>
                    <div className="text-sm text-gray-600">View and claim your exclusive deals</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Real-time Offers Section */}
      {showPersonalizedSection && realTimeOffers.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
              <div className="mb-8 lg:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-2 rounded-xl">
                    <Zap size={24} className="text-white" />
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Real-time Offers
                    </span>
                  </h2>
                </div>
                <p className="text-xl text-gray-600 max-w-2xl">
                  Context-aware deals generated as you browse our products
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">Updated in real-time</div>
                <div className="text-lg font-bold text-emerald-600">Based on your current activity</div>
              </div>
            </div>
            
            {isRealTimeOffersLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {realTimeOffers.slice(0, 3).map((offer) => (
                  <div 
                    key={offer.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-emerald-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Zap size={20} className="text-white" />
                          <span className="text-white text-sm font-bold">REAL-TIME</span>
                        </div>
                        <div className="bg-white/20 text-white text-xs font-bold px-2 py-1 rounded-full">
                          Just for you
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mt-4">{offer.offer_name}</h3>
                    </div>
                    
                    <div className="p-6">
                      {offer.product && (
                        <>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={offer.product.thumbnail_url || '/default-product.jpg'}
                                alt={offer.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{offer.product.name}</h4>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="text-lg font-bold text-emerald-600">
                                  {formatPrice(offer.discounted_price)}
                                </div>
                                <div className="text-sm text-gray-500 line-through">
                                  {formatPrice(offer.original_price)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => {
                              trackOfferInteraction(offer.id, 'click');
                              window.location.href = `/products/${offer.product_id}`;
                            }}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-300"
                          >
                            Claim This Deal
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why Lando Hypermarket Section */}
      <section className="py-5 bg-gradient-to-br from-white via-orange-50/20 to-white">
        {/* ... Keep the existing "Why Lando Hypermarket" section exactly as it is ... */}
        {/* This section remains unchanged from your original code */}
      </section>

      {/* Featured Products Section */}
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
                  onClick={() => trackProductView(product.id)}
                >
                  <ProductCard 
                    product={product} 
                    onViewTrack={() => trackProductView(product.id)}
                  />
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

      {/* New Arrivals Section */}
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
                  onClick={() => trackProductView(product.id)}
                >
                  <ProductCard 
                    product={product} 
                    onViewTrack={() => trackProductView(product.id)}
                  />
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

      {/* Smart Shopping Experience Section */}
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

      {/* Subscription Section */}
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

      {/* Testimonials Section */}
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
                
                <p className="text-gray-600 text-lg mb-8 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
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

      {/* CTA Section */}
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