'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Star, Eye, Zap, Truck, Info, Check, Tag } from 'lucide-react';
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
  const discountPercentage = price > 0 && finalPriceNum < price
    ? Math.round(((price - finalPriceNum) / price) * 100)
    : 0;

  // Safely handle stock quantity
  const stockQuantity = product.stock_quantity ? 
    (typeof product.stock_quantity === 'number' 
      ? product.stock_quantity 
      : parseInt(String(product.stock_quantity)))
    : 0;
  
  const isInStock = product.is_in_stock !== undefined 
    ? Boolean(product.is_in_stock)
    : stockQuantity > 0;

  // Safely handle is_new property
  const isNewProduct = React.useMemo(() => {
    return Boolean(
      (product as any).is_new || 
      (product as any).isNew || 
      (product as any).new_arrival ||
      (product as any).new_arrival === true ||
      (product as any).new === true
    );
  }, [product]);

  // Safely handle rating
  const rating = product.rating 
    ? (typeof product.rating === 'string' 
        ? parseFloat(product.rating) 
        : typeof product.rating === 'number' 
          ? product.rating 
          : 0)
    : 0;
  
  const displayRating = isNaN(rating) ? 0 : Math.min(Math.max(rating, 0), 5);

  // Enhanced description handling with highlights
  const getDescriptionHighlights = () => {
    const shortDesc = product.short_description || '';
    
    // Extract key features or create highlights from description
    const highlights = [];
    
    // Check for common product features
    if (shortDesc.toLowerCase().includes('organic') || shortDesc.toLowerCase().includes('natural')) {
      highlights.push({ icon: '🌿', text: '100% Organic' });
    }
    if (shortDesc.toLowerCase().includes('fresh') || shortDesc.toLowerCase().includes('farm')) {
      highlights.push({ icon: '🚜', text: 'Farm Fresh' });
    }
    if (shortDesc.toLowerCase().includes('premium') || shortDesc.toLowerCase().includes('quality')) {
      highlights.push({ icon: '⭐', text: 'Premium Quality' });
    }
    if (shortDesc.toLowerCase().includes('healthy') || shortDesc.toLowerCase().includes('nutritious')) {
      highlights.push({ icon: '💪', text: 'Highly Nutritious' });
    }
    
    // Add default highlights if none found
    if (highlights.length === 0) {
      highlights.push(
        { icon: '✅', text: 'High Quality' },
        { icon: '🚚', text: 'Fast Delivery' }
      );
    }
    
    return highlights.slice(0, 2); // Limit to 2 highlights
  };

  const descriptionHighlights = getDescriptionHighlights();

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
  const formatKSH = (amount: any) => {
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
  };

  // Get image URL
  const getImageUrl = () => {
    const baseUrl = 'https://api.hypermarket.co.ke';
    const timestamp = product.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    
    if (product.main_image) {
      const url = product.main_image.startsWith('http') 
        ? product.main_image 
        : `${baseUrl}${product.main_image.startsWith('/') ? '' : '/'}${product.main_image}`;
      
      return `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
    }
    
    if (product.thumbnail) {
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
      return `${url}${url.includes('?') ? '&' : '?'}t=${timestamp}`;
    }
    
    return `https://api.hypermarket.co.ke/storage/default-product.jpg?t=${timestamp}`;
  };

  const imageUrl = getImageUrl();

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
  const renderStarRating = () => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star
            key={i}
            size={16}
            className="text-amber-500 fill-amber-500"
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
                className="text-amber-500 fill-amber-500"
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
  };

  // Handle badge positioning
  const getBadgePosition = () => {
    const badges = [];
    
    if (isNewProduct) {
      badges.push({ type: 'new', content: 'NEW', className: 'bg-gradient-to-r from-green-500 to-emerald-600' });
    }
    
    if (product.is_featured) {
      badges.push({ type: 'featured', content: 'Featured', className: 'bg-gradient-to-r from-orange-500 to-red-500' });
    }
    
    if (discountPercentage > 0) {
      badges.push({ type: 'discount', content: `-${discountPercentage}% OFF`, className: 'bg-gradient-to-r from-red-500 to-pink-500' });
    }
    
    return badges.slice(0, 2);
  };

  const badges = getBadgePosition();

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden h-full flex flex-col">
      {/* Badges - Top Left */}
      {badges.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {badges.map((badge, index) => (
            <span 
              key={`${badge.type}-${index}`}
              className={`text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg ${badge.className}`}
            >
              {badge.content}
            </span>
          ))}
        </div>
      )}

      {/* Product Image Section */}
      <div className="relative overflow-hidden bg-gray-100">
        <Link 
          href={`/products/${product.id}`} 
          className="block"
          onClick={() => onViewTrack && onViewTrack(product.id)}
        >
          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
            <img
              src={imageUrl}
              alt={product.name || 'Product image'}
              className="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
              onError={(e) => {
                e.currentTarget.src = `https://api.hypermarket.co.ke/storage/default-product.jpg?t=${Date.now()}`;
              }}
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
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={18}
                  className={inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'}
                />
              </button>
              
              <Link
                href={`/products/${product.id}`}
                onClick={() => onViewTrack && onViewTrack(product.id)}
                className="bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                title="Quick View"
              >
                <Eye size={18} className="text-gray-600" />
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
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200">
              <Tag size={10} />
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
          <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 min-h-[40px] hover:text-emerald-600 transition-colors group-hover:text-emerald-600">
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center mb-3">
          <div className="flex mr-2">
            {renderStarRating()}
          </div>
          <span className="text-sm font-medium text-gray-700">
            {displayRating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 ml-1">
            ({product.review_count || 0})
          </span>
        </div>

        {/* HIGHLIGHTED DESCRIPTION SECTION */}
        {product.short_description && (
          <div className="mb-4 relative">
            {/* Description Header with Info Icon */}
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1 bg-emerald-50 rounded-lg">
                <Info size={12} className="text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-gray-700">Key Features</span>
            </div>
            
            {/* Description Content - Modern Highlighted Design */}
            <div className="relative">
              <div className={`transition-all duration-300 ${showFullDescription ? 'max-h-40' : 'max-h-16'} overflow-hidden`}>
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {product.short_description}
                  </p>
                </div>
              </div>
              
              {/* Read More/Less Toggle */}
              {product.short_description.length > 80 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 mt-1 flex items-center gap-1"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                  <ChevronDown 
                    size={12} 
                    className={`transition-transform duration-300 ${showFullDescription ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
            
            {/* Quick Highlights */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              {descriptionHighlights.map((highlight, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-1.5 bg-white border border-green-100 rounded-lg px-2 py-1.5"
                >
                  <span className="text-sm">{highlight.icon}</span>
                  <span className="text-xs text-gray-700 font-medium">{highlight.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              {/* Final Price */}
              <div className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {formatKSH(finalPriceNum)}
                {discountPercentage > 0 && (
                  <span className="text-xs bg-gradient-to-r from-red-100 to-pink-100 text-red-600 font-bold px-2 py-1 rounded-full">
                    -{discountPercentage}% OFF
                  </span>
                )}
              </div>
              
              {/* Original Price if on discount */}
              {finalPriceNum < price && price > 0 && (
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-500 line-through mr-2">
                    {formatKSH(price)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="text-xs">
              {isInStock ? (
                <div className="flex items-center text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></div>
                  {stockQuantity > 10 ? 'In Stock' : `${stockQuantity} left`}
                </div>
              ) : (
                <div className="flex items-center text-red-600 font-bold bg-red-50 px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></div>
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
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white py-3 px-4 rounded-xl font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg flex items-center justify-center group/button"
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
                <span className="text-green-600 font-bold flex items-center gap-1">
                  <Truck size={12} />
                  Free Shipping
                </span>
              ) : (
                <span className="text-gray-500">Shipping extra</span>
              )}
              
              {/* Review Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleReviewClick();
                }}
                className={`flex items-center gap-1 font-medium ${
                  userReview 
                    ? 'text-green-600' 
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                disabled={!isAuthenticated}
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
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
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