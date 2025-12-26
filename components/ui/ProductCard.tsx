'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Eye, Star, Truck, CheckCircle, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewModal from '../ReviewModal';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showActions = true }) => {
  const { isAuthenticated, user } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);

  // Use Laravel's computed attributes
  const finalPrice = product.final_price || product.discounted_price || product.price;
  const price = parseFloat(product.price.toString());
  const finalPriceNum = typeof finalPrice === 'number' ? finalPrice : parseFloat(finalPrice.toString());
  
  const discountPercentage = product.discounted_price
    ? Math.round(((price - finalPriceNum) / price) * 100)
    : 0;

  const stockQuantity = parseInt(product.stock_quantity.toString());
  const isInStock = product.is_in_stock !== undefined ? product.is_in_stock : stockQuantity > 0;

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
      const myReviews = myReviewsResponse.data;
      
      const existingReview = myReviews.find((review: any) => 
        review.product_id === product.id || review.product?.id === product.id
      );
      
      if (existingReview) {
        setUserReview(existingReview);
      }

      // Check if user has purchased this product
      const ordersResponse = await api.orders.getUserOrders();
      const deliveredOrders = ordersResponse.data.filter((order: any) => 
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

  // Format currency in Kenyan Shillings
  const formatKSH = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get image URL
  const getImageUrl = () => {
    if (!product.thumbnail) {
      return '/images/placeholder-product.jpg';
    }
    
    // Clean any leading slash
    const cleanThumbnail = product.thumbnail.replace(/^\//, '');
    
    // Just add the thumbnail to the base storage URL
    return `http://localhost:8000/storage/${cleanThumbnail}`;
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
        // Full star
        stars.push(
          <Star
            key={i}
            size={14}
            className="text-yellow-400 fill-yellow-400"
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        // Half star (simulated)
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
        // Empty star
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
      {/* WIDER Product Image Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Link href={`/products/${product.id}`} className="block">
          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
            <img
              src={imageUrl}
              alt={product.name}
              className="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.currentTarget.src = '/images/placeholder-product.jpg';
              }}
            />
            
            {/* Discount Badge */}
            {discountPercentage > 0 && (
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

            {/* Quick Actions Overlay */}
            {showActions && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex items-center space-x-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || !isInStock}
                    className="bg-white p-3 rounded-full shadow-xl hover:bg-primary-50 hover:scale-110 transition-all duration-200 disabled:opacity-50"
                    title="Add to cart"
                  >
                    <ShoppingCart size={20} className="text-primary-600" />
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    disabled={isAddingToWishlist}
                    className="bg-white p-3 rounded-full shadow-xl hover:bg-primary-50 hover:scale-110 transition-all duration-200"
                    title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      size={20}
                      className={inWishlist ? 'text-red-500 fill-red-500' : 'text-gray-600'}
                    />
                  </button>
                  <Link
                    href={`/products/${product.id}`}
                    className="bg-white p-3 rounded-full shadow-xl hover:bg-primary-50 hover:scale-110 transition-all duration-200"
                    title="View details"
                  >
                    <Eye size={20} className="text-gray-600" />
                  </Link>

                  {/* Review Button */}
                  {showActions && isAuthenticated && (
                    <button
                      onClick={handleReviewClick}
                      disabled={!canReview}
                      className={`bg-white p-3 rounded-full shadow-xl hover:scale-110 transition-all duration-200 ${
                        userReview 
                          ? 'bg-yellow-50 hover:bg-yellow-100' 
                          : canReview 
                            ? 'hover:bg-yellow-50' 
                            : 'opacity-50 cursor-not-allowed'
                      }`}
                      title={
                        userReview 
                          ? 'You already reviewed this product' 
                          : canReview 
                            ? 'Write a review' 
                            : 'Purchase product to review'
                      }
                    >
                      <Star
                        size={20}
                        className={
                          userReview 
                            ? 'text-yellow-500 fill-yellow-500' 
                            : canReview 
                              ? 'text-yellow-400' 
                              : 'text-gray-400'
                        }
                      />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Product Info Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Category Badge */}
        {product.category && (
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
            {product.name}
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
                onClick={() => setShowReviewModal(true)}
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
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-gray-900">
                {formatKSH(finalPriceNum)}
              </span>
              {product.discounted_price && (
                <span className="text-sm text-gray-500 line-through ml-2">
                  {formatKSH(price)}
                </span>
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
          </div>

          {/* Review Modal */}
          <ReviewModal
            isOpen={showReviewModal}
            onClose={() => {
              setShowReviewModal(false);
              // Refresh review status after modal closes
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

          {/* Add to Cart Button */}
          {showActions && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !isInStock}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center"
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
    </div>
  );
};

export default ProductCard;