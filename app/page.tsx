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
  Eye,
  Search,
  Menu,
  X,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MapPin,
  Mail,
  Phone as PhoneIcon
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

  // Logo colors from header component
  const logoColors = {
    dark: '#1a1a1a', // very dark charcoal
    greenLight: '#9dcc5e', // light green
    greenMedium: '#6a9c3d', // medium green
    gold: '#d4af37', // gold/beige
    orange: '#e67e22', // orange
    yellowGold: '#f1c40f', // yellow-gold highlight
    red: '#c0392b', // red
    lightGreenLine: '#a3d977', // light green line
  };

  const whatsappNumber = '+254716354589';
  const whatsappMessage = encodeURIComponent('Hello! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Add scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const getImageUrl = useCallback((path: string | null | undefined, defaultImage = '/default-banner.jpg'): string => {
    if (!path) return defaultImage;
    
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
    
    const baseUrl = 'https://api.hypermarket.co.ke';
    
    return `${baseUrl}/storage/${cleanPath}`;
  }, []);

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
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <div 
            className={`absolute inset-0 flex items-center justify-center ${!isActive ? 'hidden' : ''}`}
            style={{
              background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
            }}
          >
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
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-10000 ease-linear group-hover:scale-105"
                loading={isActive ? "eager" : "lazy"}
                onError={() => handleImageError(banner.id)}
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
          <div 
            className="absolute inset-0 flex items-end pb-4"
            style={{
              background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
            }}
          >
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
                    className="inline-flex items-center bg-white px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition-all duration-300 text-sm hover:scale-105"
                    style={{ color: logoColors.orange }}
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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, white, ${logoColors.lightGreenLine}20)`
        }}
      >
    
<div className="text-center">
  <div className="relative">
    <div style={{ color: logoColors.orange }}>
      <LoadingSpinner size="lg" />
    </div>
    <Leaf 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" 
      style={{ color: logoColors.orange }} 
      size={24} 
    />
  </div>
  <p className="mt-4" style={{ color: logoColors.dark }}>Loading fresh products...</p>
</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <section className="relative">
        {banners.length > 0 ? (
          <>
            <div className="hidden md:block relative h-[600px] overflow-hidden group">
              {banners.map((banner, index) => {
                const isActive = index === activeBannerIndex;
                
                return (
                  <div
                    key={banner.id}
                    className={`absolute inset-0 transition-all duration-1000 ${
                      isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
                    }`}
                  >
                    <BannerImage 
                      banner={banner} 
                      isMobile={false} 
                      isActive={isActive}
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                    
                    <div className="relative h-full flex items-center">
                      <div className="container mx-auto px-8">
                        <div className="max-w-2xl">
                          <div 
                            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6 animate-fade-in"
                            style={{ color: 'white' }}
                          >
                            <Sparkles size={16} />
                            <span className="text-sm font-semibold">Fresh & Organic</span>
                          </div>
                          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight animate-slide-up">
                            {banner.title}
                          </h1>
                          {banner.subtitle && (
                            <p className="text-xl mb-8 text-white/90 animate-slide-up delay-150">
                              {banner.subtitle}
                            </p>
                          )}
                          {banner.button_text && (
                            <a
                              href={banner.button_link || '#'}
                              className="inline-flex items-center bg-white px-8 py-4 rounded-full font-bold hover:bg-gray-50 transition-all duration-300 text-lg hover:scale-105 hover:shadow-xl animate-slide-up delay-300"
                              style={{ color: logoColors.orange }}
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
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full shadow-lg z-20 hover:bg-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Previous banner"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextBanner}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full shadow-lg z-20 hover:bg-white/30 transition-all duration-300 hover:scale-110"
                    aria-label="Next banner"
                  >
                    <ChevronRight size={24} />
                  </button>
                  
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveBannerIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === activeBannerIndex 
                            ? 'bg-white scale-125' 
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`Go to banner ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Mobile Banner */}
            <div className="md:hidden relative h-[400px] overflow-hidden">
              {banners.map((banner, index) => (
                <MobileBannerItem 
                  key={banner.id}
                  banner={banner}
                  index={index}
                />
              ))}
            </div>
          </>
        ) : (
          <div 
            className="relative h-[500px] overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${logoColors.greenLight}, ${logoColors.greenMedium}, ${logoColors.gold})`
            }}
          >
            <div className="absolute inset-0">
              <img 
                src="https://api.hypermarket.co.ke/storage/banners/default-homepage.jpg" 
                alt="Fresh produce"
                className="w-full h-full object-cover opacity-20"
              />
            </div>
            <div className="relative h-full flex items-center">
              <div className="container mx-auto px-4 text-center">
                <div 
                  className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6"
                  style={{ color: 'white' }}
                >
                  <Sparkles size={16} />
                  <span className="text-sm font-semibold">100% Organic</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white leading-tight">
                  Fresh Farm Produce<br />Delivered Daily
                </h1>
                <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                  Farm-fresh vegetables, fruits, and groceries harvested at peak ripeness
                </p>
                <a
                  href="/products"
                  className="inline-flex items-center bg-white px-8 py-4 rounded-full font-bold hover:bg-gray-50 transition-all duration-300 text-lg hover:scale-105 hover:shadow-xl"
                  style={{ color: logoColors.greenMedium }}
                >
                  Shop Now
                  <ArrowRight className="ml-3" size={20} />
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features Grid */}
      <section 
        className="py-16"
        style={{
          background: `linear-gradient(to bottom, white, ${logoColors.lightGreenLine}20)`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Truck size={32} />,
                title: 'Free Delivery',
                description: 'On orders over KES 2,000',
                color: logoColors.greenLight,
                bgColor: `${logoColors.greenLight}20`
              },
              {
                icon: <ShieldCheck size={32} />,
                title: 'Quality Guarantee',
                description: 'Freshness assured or refund',
                color: logoColors.gold,
                bgColor: `${logoColors.gold}20`
              },
              {
                icon: <Clock4 size={32} />,
                title: 'Same Day Delivery',
                description: 'Order by 2PM, get today',
                color: logoColors.orange,
                bgColor: `${logoColors.orange}20`
              },
              {
                icon: <Award size={32} />,
                title: 'Organic Certified',
                description: '100% natural products',
                color: logoColors.red,
                bgColor: `${logoColors.red}15`
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="p-8 rounded-3xl border border-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                style={{ 
                  backgroundColor: feature.bgColor,
                  borderColor: `${feature.color}40`
                }}
              >
                <div 
                  className="mb-6 transform group-hover:scale-110 transition-transform duration-300"
                  style={{ color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: logoColors.dark }}>{feature.title}</h3>
                <p style={{ color: logoColors.greenMedium }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{
                  background: `linear-gradient(135deg, ${logoColors.orange}20, ${logoColors.red}15)`,
                  color: logoColors.orange
                }}
              >
                <Star size={16} />
                <span className="text-sm font-semibold">Top Picks</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: logoColors.dark }}>
                Featured <span style={{ color: logoColors.orange }}>Products</span>
              </h2>
              <p className="text-xl max-w-2xl" style={{ color: logoColors.greenMedium }}>
                Curated selection of our best-selling items
              </p>
            </div>
            <Link
              href="/products?featured=true"
              className="group inline-flex items-center gap-3 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all duration-300 shadow-lg hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
              }}
            >
              View All Featured
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
            </Link>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 overflow-hidden"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span 
                      className="text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
                      }}
                    >
                      Featured
                    </span>
                  </div>
                  <ProductCard 
                    product={product} 
                    onViewTrack={trackProductView}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div 
                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6"
                style={{
                  background: `linear-gradient(135deg, ${logoColors.lightGreenLine}30, ${logoColors.greenLight}20)`
                }}
              >
                <Package size={48} style={{ color: logoColors.greenMedium }} />
              </div>
              <p className="text-lg" style={{ color: logoColors.greenMedium }}>No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section 
          className="py-16"
          style={{
            background: `linear-gradient(to bottom, ${logoColors.lightGreenLine}10, white)`
          }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: logoColors.dark }}>
                Shop by <span style={{ color: logoColors.greenMedium }}>Category</span>
              </h2>
              <p className="text-xl max-w-2xl mx-auto" style={{ color: logoColors.greenMedium }}>
                Browse our wide range of fresh products
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {categories.slice(0, 12).map((category, index) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 text-center"
                >
                  <div 
                    className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${logoColors.greenLight}20, ${logoColors.gold}15)`
                    }}
                  >
                    {category.image ? (
                      <img 
                        src={getImageUrl(category.image)} 
                        alt={category.name}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <Leaf size={32} style={{ color: logoColors.greenMedium }} />
                    )}
                  </div>
                  <h3 className="font-bold mb-2" style={{ color: logoColors.dark }}>{category.name}</h3>
                  {category.products_count && (
                    <p className="text-sm" style={{ color: logoColors.greenMedium }}>{category.products_count} products</p>
                  )}
                  <div 
                    className="absolute inset-0 border-2 border-transparent group-hover:border-green-500 rounded-2xl transition-colors duration-500" 
                    style={{ borderColor: logoColors.greenLight }}
                  />
                </Link>
              ))}
            </div>
            
            {categories.length > 12 && (
              <div className="text-center mt-12">
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${logoColors.dark}, ${logoColors.greenMedium})`
                  }}
                >
                  View All Categories
                  <ArrowRight size={20} />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* New Arrivals Section */}
      <section 
        className="py-16"
        style={{
          background: `linear-gradient(to bottom, white, ${logoColors.orange}10)`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row justify-between items-center mb-12">
            <div className="mb-8 lg:mb-0">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                style={{
                  background: `linear-gradient(135deg, ${logoColors.greenLight}20, ${logoColors.greenMedium}15)`,
                  color: logoColors.greenMedium
                }}
              >
                <Sparkles size={16} />
                <span className="text-sm font-semibold">Just In</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: logoColors.dark }}>
                Fresh <span style={{ color: logoColors.greenMedium }}>Arrivals</span>
              </h2>
              <p className="text-xl max-w-2xl" style={{ color: logoColors.greenMedium }}>
                Newly added to our collection
              </p>
            </div>
            <Link
              href="/products?sort=created_at&order=desc"
              className="group inline-flex items-center gap-3 text-white px-8 py-4 rounded-full font-bold hover:shadow-xl transition-all duration-300 shadow-lg hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
              }}
            >
              View All New
              <ArrowRight className="group-hover:translate-x-2 transition-transform duration-300" size={22} />
            </Link>
          </div>
          
          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 8).map((product, index) => (
                <div 
                  key={product.id} 
                  className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 overflow-hidden"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span 
                      className="text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
                      }}
                    >
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
          ) : (
            <div className="text-center py-16">
              <div 
                className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6"
                style={{
                  background: `linear-gradient(135deg, ${logoColors.greenLight}20, ${logoColors.greenMedium}15)`
                }}
              >
                <Sprout size={48} style={{ color: logoColors.greenMedium }} />
              </div>
              <p className="text-lg" style={{ color: logoColors.greenMedium }}>Check back soon for new arrivals!</p>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Banner */}
      <section 
        className="py-20 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
                <Gift size={16} />
                <span className="text-sm font-semibold">Limited Time Offer</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Subscribe & Save
                <span className="block" style={{ color: logoColors.yellowGold }}>30% OFF</span>
              </h2>
              
              <p className="text-xl mb-8 text-white/90 max-w-2xl">
                Get your favorite farm-fresh products delivered regularly. Cancel anytime, skip deliveries when you want.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/subscriptions"
                  className="group inline-flex items-center justify-center bg-white px-8 py-4 rounded-full font-bold hover:bg-gray-50 transition-all duration-300 text-lg shadow-lg hover:scale-105"
                  style={{ color: logoColors.orange }}
                >
                  Start Your Subscription
                  <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={20} />
                </Link>
                <Link
                  href="/subscriptions/plans"
                  className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition-all duration-300 text-lg"
                >
                  View Plans
                </Link>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative">
                <div 
                  className="absolute inset-0 rounded-3xl blur-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${logoColors.orange}40, ${logoColors.red}40)`
                  }}
                />
                <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: '🔄', title: 'Flexible Schedule', desc: 'Change delivery dates' },
                      { icon: '📦', title: 'Free Delivery', desc: 'On all subscription orders' },
                      { icon: '🎁', title: 'Free Gifts', desc: 'Seasonal surprises included' },
                      { icon: '⭐', title: 'Priority Support', desc: 'Dedicated customer care' }
                    ].map((feature, index) => (
                      <div 
                        key={index} 
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                      >
                        <div className="text-3xl mb-3">{feature.icon}</div>
                        <h4 className="text-lg font-bold mb-2">{feature.title}</h4>
                        <p className="text-white/80 text-sm">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: `linear-gradient(135deg, ${logoColors.yellowGold}20, ${logoColors.gold}15)`,
                color: logoColors.gold
              }}
            >
              <Star size={16} />
              <span className="text-sm font-semibold">4.8/5 Rating</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: logoColors.dark }}>
              Loved by <span style={{ color: logoColors.orange }}>Thousands</span>
            </h2>
            <p className="text-xl max-w-3xl mx-auto" style={{ color: logoColors.greenMedium }}>
              Join our community of happy customers enjoying fresh produce
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Regular Customer • 2 years',
                content: 'The quality of vegetables is exceptional! Everything arrives fresh and lasts longer than supermarket produce.',
                rating: 5,
                avatar: 'S'
              },
              {
                name: 'Michael Chen',
                role: 'Subscription User • 1 year',
                content: 'The subscription service has simplified my life. The seasonal variety keeps meals exciting!',
                rating: 5,
                avatar: 'M'
              },
              {
                name: 'Priya Sharma',
                role: 'Family of 4 • 6 months',
                content: 'My kids now love vegetables! The freshness makes all the difference in taste and nutrition.',
                rating: 5,
                avatar: 'P'
              }
            ].map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={22}
                      className={`mr-1 ${i < testimonial.rating ? 'fill-amber-500' : 'text-gray-300'}`}
                      style={{ color: i < testimonial.rating ? logoColors.gold : '#d1d5db' }}
                    />
                  ))}
                </div>
                
                <p className="text-lg mb-8 leading-relaxed italic" style={{ color: logoColors.dark }}>
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4"
                    style={{
                      background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
                    }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-lg" style={{ color: logoColors.dark }}>{testimonial.name}</p>
                    <p style={{ color: logoColors.greenMedium }}>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20 text-white"
        style={{
          background: `linear-gradient(135deg, ${logoColors.dark}, ${logoColors.greenMedium})`
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
              Ready to Taste the
              <span className="block" style={{ color: logoColors.greenLight }}>
                Fresh Difference?
              </span>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of health-conscious families enjoying farm-fresh goodness delivered to their door.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/products"
                className="group inline-flex items-center justify-center text-white px-10 py-5 rounded-full font-bold hover:shadow-2xl transition-all duration-300 text-lg shadow-lg hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
                }}
              >
                Start Shopping
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform duration-300" size={22} />
              </Link>
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center bg-transparent border-2 border-white/30 text-white px-10 py-5 rounded-full font-bold hover:bg-white/10 transition-all duration-300 text-lg"
              >
                Create Free Account
              </Link>
            </div>
            
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '10,000+', label: 'Happy Customers' },
                { value: '24/7', label: 'Support Available' },
                { value: '100%', label: 'Organic Products' },
                { value: '30-min', label: 'Delivery Promise' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold mb-2" style={{ color: logoColors.greenLight }}>
                    {stat.value}
                  </div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              ))}
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
            background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
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
                background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
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
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg group-hover:bg-green-200 transition-colors"
                  style={{ backgroundColor: `${logoColors.greenLight}20` }}
                >
                  <MessageCircle size={20} style={{ color: logoColors.greenMedium }} />
                </div>
                <div className="flex-1">
                  <div className="font-medium" style={{ color: logoColors.dark }}>WhatsApp</div>
                  <div className="text-xs" style={{ color: logoColors.greenMedium }}>Instant reply</div>
                </div>
              </a>
              
              <a
                href="tel:+254716354589"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg group-hover:bg-blue-200 transition-colors"
                  style={{ backgroundColor: `${logoColors.blue}20` }}
                >
                  <Phone size={20} style={{ color: logoColors.greenMedium }} />
                </div>
                <div className="flex-1">
                  <div className="font-medium" style={{ color: logoColors.dark }}>Call Us</div>
                  <div className="text-xs" style={{ color: logoColors.greenMedium }}>+254 716 354 589</div>
                </div>
              </a>
              
              <a
                href="/help"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div 
                  className="p-2 rounded-lg group-hover:bg-purple-200 transition-colors"
                  style={{ backgroundColor: `${logoColors.gold}20` }}
                >
                  <HelpCircle size={20} style={{ color: logoColors.greenMedium }} />
                </div>
                <div className="flex-1">
                  <div className="font-medium" style={{ color: logoColors.dark }}>Help Center</div>
                  <div className="text-xs" style={{ color: logoColors.greenMedium }}>FAQs & guides</div>
                </div>
              </a>
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
          background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
        }}
        aria-label="Scroll to top"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
};

export default HomePage;