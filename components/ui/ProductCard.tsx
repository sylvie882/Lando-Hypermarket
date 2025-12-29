'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Eye, Star, Truck, CheckCircle, Tag, Percent, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '../ReviewModal';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  showPersonalizedPrice?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showActions = true,
  showPersonalizedPrice = false
}) => {
  const { isAuthenticated, user } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);

  // Personalized Price Logic - FIXED TYPE ISSUES
  const personalizedPrice = product.personalized_price || null;
  const hasPersonalizedOffer = showPersonalizedPrice && 
    personalizedPrice?.is_personalized_offer === true &&
    personalizedPrice.final_price < (product.price || 0);
  
  // Use personalized price if available, otherwise use regular pricing
  const finalPrice = hasPersonalizedOffer 
    ? personalizedPrice.final_price 
    : (product.final_price || product.discounted_price || product.price || 0);
  
  // Safely convert prices to numbers
  const price = typeof product.price === 'number' ? product.price : 
                product.price ? parseFloat(String(product.price)) : 0;
  
  const finalPriceNum = typeof finalPrice === 'number' ? finalPrice : 
                        finalPrice ? parseFloat(String(finalPrice)) : 0;
  
  // Calculate discount percentage based on original price vs final price
  const discountPercentage = price > 0 && finalPriceNum < price
    ? Math.round(((price - finalPriceNum) / price) * 100)
    : 0;

  // Personalized offer discount percentage (if different from regular discount)
  const personalizedDiscountPercentage = hasPersonalizedOffer && personalizedPrice?.original_price
    ? Math.round(((personalizedPrice.original_price - personalizedPrice.final_price) / personalizedPrice.original_price) * 100)
    : 0;

  const stockQuantity = typeof product.stock_quantity === 'number' 
    ? product.stock_quantity 
    : parseInt(String(product.stock_quantity || 0));
  
  const isInStock = product.is_in_stock !== undefined ? 
                   product.is_in_stock : 
                   stockQuantity > 0;

  // Safely handle rating - convert to number
  const rating = typeof product.rating === 'string' 
    ? parseFloat(product.rating) 
    : typeof product.rating === 'number' 
      ? product.rating 
      : 0;
  
  const displayRating = isNaN(rating) ? 0 : rating;

  // Check if user can review this product
  useEffect(() => {
    if (isAuthenticated && product.id) {
      checkUserReviewStatus();
    }
  }, [isAuthenticated, product.id]);

  const checkUserReviewStatus = async () => {
    try {
      // Check if user has already reviewed this product
      const myReviewsResponse = await api.reviews.getMyReviews();
      const myReviews = myReviewsResponse.data || [];
      
      const existingReview = myReviews.find((review: any) => 
        review.product_id === product.id || review.product?.id === product.id
      );
      
      if (existingReview) {
        setUserReview(existingReview);
      }

      // Check if user has purchased this product
      const ordersResponse = await api.orders.getAll({
        per_page: 100,
        status: 'delivered,completed',
      });
      
      // Handle different response structures
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

  // Format currency in Kenyan Shillings - FIXED: Handle non-number values
  const formatKSH = (amount: any) => {
    const numAmount = typeof amount === 'number' ? amount : 
                     amount ? parseFloat(String(amount)) : 0;
    
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

  // Get image URL - SIMPLIFIED VERSION
  const getImageUrl = () => {
    // Base URL for all images
    const baseUrl = 'https://api.hypermarket.co.ke';
    
    // First, try main_image attribute (from Laravel model)
    if (product.main_image) {
      return product.main_image.startsWith('http') ? 
             product.main_image : 
             `${baseUrl}${product.main_image.startsWith('/') ? '' : '/'}${product.main_image}`;
    }
    
    // Then try thumbnail
    if (product.thumbnail) {
      if (product.thumbnail.startsWith('http')) {
        return product.thumbnail;
      }
      // Construct full URL for storage images
      if (product.thumbnail.startsWith('/storage/')) {
        return `${baseUrl}${product.thumbnail}`;
      }
      if (product.thumbnail.startsWith('storage/')) {
        return `${baseUrl}/${product.thumbnail}`;
      }
      return `${baseUrl}/storage/${product.thumbnail}`;
    }
    
    // Then try gallery_urls
    if (product.gallery_urls && Array.isArray(product.gallery_urls) && product.gallery_urls.length > 0) {
      const firstImage = product.gallery_urls[0];
      if (firstImage.startsWith('http')) {
        return firstImage;
      }
      return `${baseUrl}/storage/${firstImage}`;
    }
    
    // Then try images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      const firstImage = product.images[0];
      if (firstImage.startsWith('http')) {
        return firstImage;
      }
      return `${baseUrl}/storage/${firstImage}`;
    }
    
    // Fallback to default product image
    return 'https://api.hypermarket.co.ke/storage/default-product.jpg';
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
      const checkResponse = await api.wishlist.check(product.id);
      const isInWishlist = checkResponse.data?.in_wishlist || false;
      
      if (isInWishlist) {
        await api.wishlist.remove(product.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.wishlist.add(product.id);
        setInWishlist(true);
        toast.success('Added to wishlist!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };

  // Check wishlist status on mount
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (isAuthenticated && product.id) {
        try {
          const checkResponse = await api.wishlist.check(product.id);
          setInWishlist(checkResponse.data?.in_wishlist || false);
        } catch (error) {
          console.error('Error checking wishlist:', error);
        }
      }
    };
    
    checkWishlistStatus();
  }, [isAuthenticated, product.id]);

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

  // Enhanced Star Rating Display with half stars
  const renderStarRating = () => {
    const stars = [];
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <Star
            key={i}
            size={14}
            className="text-yellow-400 fill-yellow-400"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star
              size={14}
              className="text-gray-300"
            />
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                size={14}
                className="text-yellow-400 fill-yellow-400"
              />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star
            key={i}
            size={14}
            className="text-gray-300"
          />
        );
      }
    }
    
    return stars;
  };

  return (
    <div className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden h-full flex flex-col transform hover:-translate-y-1 w-full">
      {/* Product Image Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
            <img
              src={imageUrl}
              alt={product.name}
              className="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = 'https://api.hypermarket.co.ke/storage/default-product.jpg';
              }}
            />
            
            {/* Personalized Offer Badge - Only show when showPersonalizedPrice is true */}
            {hasPersonalizedOffer && personalizedDiscountPercentage > 0 && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-xl z-10 flex items-center gap-1">
                <Sparkles size={12} />
                -{personalizedDiscountPercentage}%
              </div>
            )}
            
            {/* Regular Discount Badge - Only show if not showing personalized offer */}
            {!hasPersonalizedOffer && discountPercentage > 0 && (
              <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-xl z-10">
                -{discountPercentage}% OFF
              </div>
            )}

            {/* Out of Stock Badge */}
            {!isInStock && (
              <div className="absolute top-3 right-3 bg-gray-900/90 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-xl z-10">
                Out of Stock
              </div>
            )}

            {/* User Review Badge */}
            {userReview && (
              <div className="absolute bottom-3 left-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-xl z-10">
                Reviewed
              </div>
            )}
          </div>
        </Link>

        {/* Floating Action Button */}
        {showActions && (
          <div className="absolute bottom-0 left-0 right-0">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent h-24"></div>
              
              <div className="relative px-4 pb-4 pt-10">
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !isInStock}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isInStock 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white' 
                        : 'bg-gray-600 text-white'
                    }`}
                  >
                    {isAddingToCart ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Adding...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        {!isInStock ? 'Out of Stock' : 'Add to Cart'}
                      </>
                    )}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddToWishlist}
                      disabled={isAddingToWishlist}
                      className={`p-2.5 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 ${
                        inWishlist 
                          ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart
                        size={16}
                        className={inWishlist ? 'fill-red-500' : ''}
                      />
                    </button>
                    
                    <Link
                      href={`/products/${product.id}`}
                      className="p-2.5 bg-white text-gray-700 hover:bg-gray-50 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
                      title="View details"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Info Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category Badge */}
        {product.category?.name && (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
              <Tag size={12} />
              {product.category.name}
            </span>
          </div>
        )}

        {/* Product Title */}
        <Link href={`/products/${product.id}`} className="group/title mb-2">
          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover/title:text-primary-600 line-clamp-2 min-h-[48px]">
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* Rating & Reviews */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="flex">
              {renderStarRating()}
            </div>
            <span className="text-sm font-medium text-gray-700 ml-1.5">
              {displayRating.toFixed(1)}
            </span>
          </div>
          <Link 
            href={`/products/${product.id}#reviews`}
            className="text-xs text-primary-600 hover:text-primary-800 hover:underline"
          >
            ({product.review_count || 0} reviews)
          </Link>
        </div>

        {/* User Review Status */}
        {isAuthenticated && (
          <div className="mb-2">
            {userReview ? (
              <div className="flex items-center text-xs text-green-600">
                <CheckCircle size={12} className="mr-1" />
                <span>You reviewed this product</span>
                {userReview.rating && (
                  <span className="ml-1 font-medium">
                    ({userReview.rating}/5)
                  </span>
                )}
              </div>
            ) : canReview ? (
              <button
                onClick={handleReviewClick}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                <Star size={12} className="mr-1" />
                Write a review
              </button>
            ) : (
              <div className="text-xs text-gray-500">
                Purchase to review this product
              </div>
            )}
          </div>
        )}

        {/* Product Description */}
        {product.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-1">
            {product.description}
          </p>
        )}

        {/* Price Section */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              {/* Personalized Price Display */}
              {hasPersonalizedOffer && personalizedPrice ? (
                <>
                  <div className="flex items-baseline">
                    <span className="text-xl font-bold text-purple-600">
                      {formatKSH(personalizedPrice.final_price)}
                    </span>
                    <span className="text-sm text-gray-500 line-through ml-2">
                      {formatKSH(personalizedPrice.original_price)}
                    </span>
                  </div>
                  <div className="text-xs text-purple-600 font-medium mt-1 flex items-center gap-1">
                    <Sparkles size={10} />
                    Personalized Price
                    {personalizedPrice?.offer_name && (
                      <span className="text-xs text-gray-600 ml-1">({personalizedPrice.offer_name})</span>
                    )}
                  </div>
                </>
              ) : (
                /* Regular Price Display */
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-gray-900">
                    {formatKSH(finalPriceNum)}
                  </span>
                  {finalPriceNum < price && price > 0 && (
                    <span className="text-sm text-gray-500 line-through ml-2">
                      {formatKSH(price)}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="text-xs">
              {isInStock ? (
                <div className="flex items-center text-green-600 font-medium">
                  <CheckCircle size={12} className="mr-1" />
                  {stockQuantity > 10 ? 'In Stock' : `${stockQuantity} left`}
                </div>
              ) : (
                <div className="text-red-600 font-medium">Out of Stock</div>
              )}
            </div>
          </div>

          {/* Features */}
          <div className="flex items-center gap-2 mb-3">
            {product.is_free_shipping && (
              <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
                <Truck size={12} className="mr-1" />
                <span>Free Shipping</span>
              </div>
            )}
            {product.is_featured && (
              <div className="flex items-center text-orange-600 bg-orange-50 px-2 py-1 rounded text-xs">
                <Star size={12} className="mr-1" />
                <span>Featured</span>
              </div>
            )}
            {hasPersonalizedOffer && (
              <div className="flex items-center text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs">
                <Percent size={12} className="mr-1" />
                <span>Exclusive Offer</span>
              </div>
            )}
          </div>
          
          {/* Bottom "Add to Cart" Button for mobile */}
          {showActions && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !isInStock}
              className="md:hidden w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center"
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
                  <ShoppingCart size={16} className="mr-2" />
                  {!isInStock ? 'Out of Stock' : 'Add to Cart'}
                </>
              )}
            </button>
          )}
        </div>
      </div>

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