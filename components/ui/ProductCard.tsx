'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Star, Eye, Zap, Truck, Info, Check, Tag, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '../ReviewModal';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  showPersonalizedPrice?: boolean;
  onViewTrack?: (productId: number) => void;
}

const wishlistCheckCache = new Map<number, {
  timestamp: number;
  result: boolean;
  promise?: Promise<boolean>;
}>();

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showActions = true,
  showPersonalizedPrice = false,
  onViewTrack
}) => {
  const { isAuthenticated, user } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [hasCheckedWishlist, setHasCheckedWishlist] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Logo colors
  const logoColors = {
    dark: '#1a1a1a',
    greenLight: '#9dcc5e',
    greenMedium: '#6a9c3d',
    gold: '#d4af37',
    orange: '#e67e22',
    yellowGold: '#f1c40f',
    red: '#c0392b',
    lightGreenLine: '#a3d977',
  };

  // Track product view when component mounts or product changes
  useEffect(() => {
    if (onViewTrack && product.id) {
      onViewTrack(product.id);
    }
  }, [product.id, onViewTrack]);

  // Safely extract values with fallbacks
  const finalPrice = product.final_price || product.discounted_price || product.price || 0;
  const price = product.price ? parseFloat(String(product.price)) : 0;
  const finalPriceNum = finalPrice ? parseFloat(String(finalPrice)) : 0;
  
  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    return price > 0 && finalPriceNum < price
      ? Math.round(((price - finalPriceNum) / price) * 100)
      : 0;
  }, [price, finalPriceNum]);

  // Safely handle stock quantity
  const stockQuantity = useMemo(() => {
    return product.stock_quantity ? 
      (typeof product.stock_quantity === 'number' 
        ? product.stock_quantity 
        : parseInt(String(product.stock_quantity)))
      : 0;
  }, [product.stock_quantity]);
  
  const isInStock = useMemo(() => {
    return product.is_in_stock !== undefined 
      ? Boolean(product.is_in_stock)
      : stockQuantity > 0;
  }, [product.is_in_stock, stockQuantity]);

  // Safely handle is_new property
  const isNewProduct = useMemo(() => {
    return Boolean(
      (product as any).is_new || 
      (product as any).isNew || 
      (product as any).new_arrival ||
      (product as any).new_arrival === true ||
      (product as any).new === true
    );
  }, [product]);

  // Safely handle description
  const description = useMemo(() => {
    return product.description || '';
  }, [product.description]);

  // Enhanced description handling with highlights
  const getDescriptionHighlights = useCallback(() => {
    const desc = description || '';
    const highlights = [];
    
    if (desc.toLowerCase().includes('organic') || desc.toLowerCase().includes('natural')) {
      highlights.push({ icon: '🌿', text: '100% Organic' });
    }
    if (desc.toLowerCase().includes('fresh') || desc.toLowerCase().includes('farm')) {
      highlights.push({ icon: '🚜', text: 'Farm Fresh' });
    }
    if (desc.toLowerCase().includes('premium') || desc.toLowerCase().includes('quality')) {
      highlights.push({ icon: '⭐', text: 'Premium Quality' });
    }
    if (desc.toLowerCase().includes('healthy') || desc.toLowerCase().includes('nutritious')) {
      highlights.push({ icon: '💪', text: 'Highly Nutritious' });
    }
    if (desc.toLowerCase().includes('crisp') || desc.toLowerCase().includes('crunchy')) {
      highlights.push({ icon: '🥬', text: 'Crisp & Fresh' });
    }
    if (desc.toLowerCase().includes('vitamin') || desc.toLowerCase().includes('mineral')) {
      highlights.push({ icon: '🔬', text: 'Rich in Nutrients' });
    }
    
    if (highlights.length === 0) {
      highlights.push(
        { icon: '✅', text: 'High Quality' },
        { icon: '🚚', text: 'Fast Delivery' }
      );
    }
    
    return highlights.slice(0, 3);
  }, [description]);

  const descriptionHighlights = useMemo(() => getDescriptionHighlights(), [getDescriptionHighlights]);

  // Safely handle rating
  const rating = useMemo(() => {
    const r = product.rating 
      ? (typeof product.rating === 'string' 
          ? parseFloat(product.rating) 
          : typeof product.rating === 'number' 
            ? product.rating 
            : 0)
      : 0;
    
    return isNaN(r) ? 0 : Math.min(Math.max(r, 0), 5);
  }, [product.rating]);
  
  const displayRating = rating;

  // Check if user can review this product
  useEffect(() => {
    if (isAuthenticated && product.id) {
      checkUserReviewStatus();
    }
  }, [isAuthenticated, product.id]);

  const checkUserReviewStatus = async () => {
    try {
      const myReviewsResponse = await api.reviews.getMyReviews();
      const myReviews = myReviewsResponse.data || [];
      
      const existingReview = myReviews.find((review: any) => 
        review.product_id === product.id || review.product?.id === product.id
      );
      
      if (existingReview) {
        setUserReview(existingReview);
      }

      const ordersResponse = await api.orders.getAll({
        per_page: 100,
        status: 'delivered,completed',
      });
      
      let ordersData = [];
      if (ordersResponse.data && ordersResponse.data.data && Array.isArray(ordersResponse.data.data)) {
        ordersData = ordersResponse.data.data;
      } else if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
        ordersData = ordersResponse.data;
      } else if (ordersResponse.data && ordersResponse.data.orders && Array.isArray(ordersResponse.data.orders)) {
        ordersData = ordersResponse.data.orders;
      }

      const deliveredOrders = ordersData.filter((order: any) => 
        order.status === 'delivered' || order.status === 'completed'
      );

      const hasPurchased = deliveredOrders.some((order: any) =>
        order.items?.some((item: any) => 
          item.product_id === product.id || item.product?.id === product.id
        )
      );

      setCanReview(hasPurchased && !existingReview);
    } catch (error) {
      console.error('Error checking review status:', error);
      setCanReview(false);
    }
  };

  // Check wishlist status
  const checkWishlistStatus = useCallback(async (productId: number) => {
    if (!isAuthenticated || hasCheckedWishlist) return;
    
    const cached = wishlistCheckCache.get(productId);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < 30000) {
      setInWishlist(cached.result);
      setHasCheckedWishlist(true);
      return;
    }
    
    try {
      if (cached?.promise) {
        const result = await cached.promise;
        setInWishlist(result);
        setHasCheckedWishlist(true);
        return;
      }
      
      const checkPromise = (async () => {
        try {
          const checkResponse = await api.wishlist.check(productId);
          const isInWishlist = checkResponse.data?.in_wishlist || 
                              checkResponse.data?.is_in_wishlist || 
                              false;
          
          wishlistCheckCache.set(productId, {
            timestamp: Date.now(),
            result: isInWishlist,
            promise: undefined
          });
          
          return isInWishlist;
        } catch (error: any) {
          if (error.response?.status !== 429) {
            console.error('Failed to check wishlist status:', error);
          }
          return false;
        }
      })();
      
      wishlistCheckCache.set(productId, {
        timestamp: now,
        result: false,
        promise: checkPromise
      });
      
      const result = await checkPromise;
      setInWishlist(result);
      setHasCheckedWishlist(true);
    } catch (error) {
      console.error('Error in wishlist check:', error);
      setInWishlist(false);
    }
  }, [isAuthenticated, hasCheckedWishlist]);

  // Check wishlist status on mount
  useEffect(() => {
    if (isAuthenticated && product.id && !hasCheckedWishlist) {
      const timer = setTimeout(() => {
        checkWishlistStatus(product.id);
      }, Math.random() * 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, product.id, hasCheckedWishlist, checkWishlistStatus]);

  // Format currency in Kenyan Shillings
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

  // Get optimized image URL
  const getImageUrl = useCallback(() => {
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
      return `https://api.hypermarket.co.ke/storage/default-product.jpg?t=${timestamp}`;
    }
    
    // Add cache busting and optimize for web
    return `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}&w=400&h=300&fit=crop&auto=format`;
  }, [product.main_image, product.thumbnail, product.updated_at]);

  const imageUrl = useMemo(() => getImageUrl(), [getImageUrl]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (!isInStock) {
      toast.error('Product is out of stock');
      return;
    }

    setIsAddingToCart(true);
    try {
      await api.cart.addItem({
        product_id: product.id,
        quantity: 1,
      });
      toast.success('Added to cart!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    setIsAddingToWishlist(true);
    try {
      if (inWishlist) {
        await api.wishlist.remove(product.id);
        setInWishlist(false);
        wishlistCheckCache.delete(product.id);
        setHasCheckedWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.wishlist.add(product.id);
        setInWishlist(true);
        wishlistCheckCache.set(product.id, {
          timestamp: Date.now(),
          result: true
        });
        toast.success('Added to wishlist!');
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        toast.error('Please wait a moment before trying again');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update wishlist');
      }
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  const handleReviewClick = () => {
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      return;
    }

    if (userReview) {
      toast.error('You have already reviewed this product');
      return;
    }

    if (!canReview) {
      toast.error('You need to purchase this product before reviewing it');
      return;
    }

    setShowReviewModal(true);
  };

  // Star Rating Display
  const renderStarRating = useCallback(() => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star
            key={i}
            size={16}
            style={{ color: logoColors.gold }}
            className="fill-current"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star
              size={16}
              className="text-gray-300"
            />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                size={16}
                style={{ color: logoColors.gold }}
                className="fill-current"
              />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star
            key={i}
            size={16}
            className="text-gray-300"
          />
        );
      }
    }
    
    return stars;
  }, [displayRating, logoColors.gold]);

  // Handle badge positioning
  const getBadgePosition = useCallback(() => {
    const badges = [];
    
    if (isNewProduct) {
      badges.push({ 
        type: 'new', 
        content: 'NEW', 
        className: 'text-white',
        style: {
          background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
        }
      });
    }
    
    if (product.is_featured) {
      badges.push({ 
        type: 'featured', 
        content: 'Featured', 
        className: 'text-white',
        style: {
          background: `linear-gradient(135deg, ${logoColors.orange}, ${logoColors.red})`
        }
      });
    }
    
    if (discountPercentage > 0) {
      badges.push({ 
        type: 'discount', 
        content: `-${discountPercentage}% OFF`, 
        className: 'text-white',
        style: {
          background: `linear-gradient(135deg, ${logoColors.red}, ${logoColors.orange})`
        }
      });
    }
    
    return badges.slice(0, 2);
  }, [isNewProduct, product.is_featured, discountPercentage, logoColors]);

  const badges = useMemo(() => getBadgePosition(), [getBadgePosition]);

  // Reset image state when product changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [product.id]);

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Badges - Top Left */}
      {badges.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {badges.map((badge, index) => (
            <span 
              key={`${badge.type}-${index}`}
              className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${badge.className}`}
              style={badge.style}
            >
              {badge.content}
            </span>
          ))}
        </div>
      )}

      {/* Product Image Section - Optimized */}
      <div className="relative overflow-hidden bg-gray-50">
        <Link 
          href={`/products/${product.id}`} 
          className="block"
          onClick={() => onViewTrack && onViewTrack(product.id)}
        >
          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
            {/* Loading skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
            )}
            
            {/* Optimized Image with Next.js Image component */}
            <Image
              src={imageError ? '/placeholder-product.jpg' : imageUrl}
              alt={product.name || 'Product image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 ${
                imageLoaded ? 'group-hover:scale-110 opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
              loading="lazy"
              quality={85}
              unoptimized={false}
            />
            
            {/* Out of Stock Overlay */}
            {!isInStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white/90 text-gray-800 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                  Out of Stock
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToWishlist();
                }}
                disabled={isAddingToWishlist}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                style={{ color: logoColors.dark }}
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={18}
                  className={inWishlist ? 'fill-current' : ''}
                  style={inWishlist ? { color: logoColors.red } : undefined}
                />
              </button>
              
              <Link
                href={`/products/${product.id}`}
                onClick={() => onViewTrack && onViewTrack(product.id)}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                style={{ color: logoColors.dark }}
                title="Quick View"
              >
                <Eye size={18} />
              </Link>
            </div>
          </div>
        </Link>
      </div>

      {/* Product Info Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category Badge */}
        {product.category?.name && (
          <div className="mb-2">
            <span 
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{
                background: `linear-gradient(135deg, ${logoColors.lightGreenLine}20, ${logoColors.greenLight}15)`,
                color: logoColors.greenMedium,
                borderColor: `${logoColors.greenLight}40`
              }}
            >
              <Tag size={10} style={{ color: logoColors.greenMedium }} />
              {product.category.name}
            </span>
          </div>
        )}

        {/* Product Title */}
        <Link 
          href={`/products/${product.id}`} 
          className="mb-2"
          onClick={() => onViewTrack && onViewTrack(product.id)}
        >
          <h3 
            className="font-bold text-sm leading-tight line-clamp-2 min-h-[40px] transition-colors"
            style={{ color: logoColors.dark }}
          >
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex mr-2">
            {renderStarRating()}
          </div>
          <span 
            className="text-sm font-medium"
            style={{ color: logoColors.dark }}
          >
            {displayRating.toFixed(1)}
          </span>
          <span 
            className="text-sm ml-1"
            style={{ color: logoColors.greenMedium }}
          >
            ({product.review_count || 0})
          </span>
        </div>

        {/* HIGHLIGHTED DESCRIPTION SECTION */}
        {description && (
          <div className="mb-4 relative">
            {/* Description Header with Info Icon */}
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="p-1 rounded-lg"
                style={{ backgroundColor: `${logoColors.lightGreenLine}20` }}
              >
                <Info size={12} style={{ color: logoColors.greenMedium }} />
              </div>
              <span 
                className="text-xs font-semibold"
                style={{ color: logoColors.dark }}
              >
                Product Details
              </span>
            </div>
            
            {/* Description Content - Modern Highlighted Design */}
            <div className="relative">
              <div className={`transition-all duration-300 ${showFullDescription ? 'max-h-40' : 'max-h-16'} overflow-hidden`}>
                <div 
                  className="rounded-xl p-3 border"
                  style={{
                    background: `linear-gradient(135deg, ${logoColors.lightGreenLine}15, ${logoColors.greenLight}10)`,
                    borderColor: `${logoColors.lightGreenLine}40`
                  }}
                >
                  <p 
                    className="text-xs leading-relaxed"
                    style={{ color: logoColors.dark }}
                  >
                    {description}
                  </p>
                </div>
              </div>
              
              {/* Read More/Less Toggle */}
              {description.length > 100 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-xs font-medium mt-1 flex items-center gap-1"
                  style={{ color: logoColors.greenMedium }}
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                  <ChevronDown 
                    size={12} 
                    className={`transition-transform duration-300 ${showFullDescription ? 'rotate-180' : ''}`}
                    style={{ color: logoColors.greenMedium }}
                  />
                </button>
              )}
            </div>
            
            {/* Quick Highlights */}
            {descriptionHighlights.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {descriptionHighlights.map((highlight, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border"
                    style={{ 
                      borderColor: `${logoColors.greenLight}40`,
                      color: logoColors.dark
                    }}
                  >
                    <span className="text-sm">{highlight.icon}</span>
                    <span className="text-xs truncate">{highlight.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Price Section */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              {/* Final Price */}
              <div 
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: logoColors.dark }}
              >
                {formatKSH(finalPriceNum)}
                {discountPercentage > 0 && (
                  <span 
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      background: `linear-gradient(135deg, ${logoColors.red}15, ${logoColors.orange}15)`,
                      color: logoColors.red
                    }}
                  >
                    -{discountPercentage}% OFF
                  </span>
                )}
              </div>
              
              {/* Original Price if on discount */}
              {finalPriceNum < price && price > 0 && (
                <div className="flex items-center mt-1">
                  <span 
                    className="text-sm line-through mr-2"
                    style={{ color: logoColors.greenMedium }}
                  >
                    {formatKSH(price)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="text-xs">
              {isInStock ? (
                <div 
                  className="flex items-center font-bold px-2 py-1 rounded-full"
                  style={{
                    color: logoColors.greenMedium,
                    backgroundColor: `${logoColors.greenLight}20`
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: logoColors.greenMedium }}
                  ></div>
                  {stockQuantity > 10 ? 'In Stock' : `${stockQuantity} left`}
                </div>
              ) : (
                <div 
                  className="flex items-center font-bold px-2 py-1 rounded-full"
                  style={{
                    color: logoColors.red,
                    backgroundColor: `${logoColors.red}15`
                  }}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: logoColors.red }}
                  ></div>
                  Out of Stock
                </div>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          {showActions && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !isInStock}
              className="w-full text-white py-3 px-4 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg flex items-center justify-center group/button"
              style={{
                background: `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${logoColors.greenMedium}dd, ${logoColors.greenLight}dd)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = `linear-gradient(135deg, ${logoColors.greenMedium}, ${logoColors.greenLight})`;
              }}
            >
              {isAddingToCart ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : (
                <>
                  <ShoppingCart size={18} className="mr-2 group-hover/button:scale-110 transition-transform duration-300" />
                  {!isInStock ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </button>
          )}

          {/* Additional Info */}
          {showActions && (
            <div className="flex justify-between mt-3 text-xs">
              {/* Free Shipping */}
              {(product as any).is_free_shipping ? (
                <span 
                  className="font-bold flex items-center gap-1"
                  style={{ color: logoColors.greenMedium }}
                >
                  <Truck size={12} />
                  Free Shipping
                </span>
              ) : (
                <span style={{ color: logoColors.greenMedium }}>Shipping extra</span>
              )}
              
              {/* Review Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleReviewClick();
                }}
                className={`flex items-center gap-1 font-medium ${userReview ? '' : 'hover:text-blue-600'}`}
                disabled={!isAuthenticated}
                style={{ color: userReview ? logoColors.greenMedium : logoColors.dark }}
              >
                {userReview ? (
                  <>
                    <Check size={12} />
                    Reviewed
                  </>
                ) : (
                  'Write Review'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Best Seller Badge - Bottom Right */}
      {(product as any).is_bestseller && (
        <div className="absolute bottom-3 right-3 z-10">
          <span 
            className="text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1"
            style={{
              background: `linear-gradient(135deg, ${logoColors.gold}, ${logoColors.orange})`
            }}
          >
            <Zap size={10} />
            Best Seller
          </span>
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          if (isAuthenticated) {
            checkUserReviewStatus();
          }
        }}
        productId={product.id}
        productName={product.name}
        productImage={imageUrl}
        existingReview={userReview}
        onSuccess={() => {
          toast.success(userReview ? 'Review updated!' : 'Review submitted!');
          checkUserReviewStatus();
        }}
      />
    </div>
  );
};

export default ProductCard;