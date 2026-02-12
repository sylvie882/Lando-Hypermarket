'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Eye, Sparkles, Zap, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  onViewTrack?: (productId: number) => void;
  hideFeaturedBadge?: boolean;
}

const wishlistCheckCache = new Map<number, {
  timestamp: number;
  result: boolean;
  promise?: Promise<boolean>;
}>();

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showActions = true,
  onViewTrack,
  hideFeaturedBadge = false
}) => {
  const { isAuthenticated } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [hasCheckedWishlist, setHasCheckedWishlist] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Price calculations
  const finalPrice = product.final_price || product.discounted_price || product.price || 0;
  const price = product.price ? parseFloat(String(product.price)) : 0;
  const finalPriceNum = finalPrice ? parseFloat(String(finalPrice)) : 0;
  
  const discountPercentage = useMemo(() => {
    return price > 0 && finalPriceNum < price
      ? Math.round(((price - finalPriceNum) / price) * 100)
      : 0;
  }, [price, finalPriceNum]);

  // Stock status
  const stockQuantity = product.stock_quantity ? 
    (typeof product.stock_quantity === 'number' 
      ? product.stock_quantity 
      : parseInt(String(product.stock_quantity)))
    : 0;
  
  const isInStock = product.is_in_stock !== undefined 
    ? Boolean(product.is_in_stock)
    : stockQuantity > 0;

  const isNewProduct = Boolean(
    (product as any).is_new || 
    (product as any).isNew || 
    (product as any).new_arrival
  );

  // Wishlist check
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

  useEffect(() => {
    if (isAuthenticated && product.id && !hasCheckedWishlist) {
      const timer = setTimeout(() => {
        checkWishlistStatus(product.id);
      }, Math.random() * 300);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, product.id, hasCheckedWishlist, checkWishlistStatus]);

  // Format currency
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

  // Image URL - Single image only
  const imageUrl = useMemo(() => {
    const baseUrl = 'https://api.hypermarket.co.ke';
    const timestamp = product.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    
    const imagePath = product.main_image || product.thumbnail;
    
    if (!imagePath) {
      return `https://via.placeholder.com/400x400/f5f5f5/999999?text=No+Image`;
    }
    
    if (imagePath.startsWith('http')) {
      return `${imagePath}${imagePath.includes('?') ? '&' : '?'}t=${timestamp}&w=400&h=400&fit=crop&auto=format`;
    }
    
    let cleanPath = imagePath;
    
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    if (cleanPath.includes('products/thumbnails/')) {
      if (!cleanPath.startsWith('storage/')) {
        cleanPath = `storage/${cleanPath}`;
      }
    } else if (!cleanPath.startsWith('storage/')) {
      cleanPath = `storage/${cleanPath}`;
    }
    
    const finalUrl = `${baseUrl}/${cleanPath}`;
    return `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${timestamp}&w=400&h=400&fit=crop&auto=format`;
  }, [product.main_image, product.thumbnail, product.updated_at, product.id]);

  // Handlers
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

  // Badges
  const badges = useMemo(() => {
    const badgesArray = [];
    
    if (isNewProduct) {
      badgesArray.push({ 
        type: 'new', 
        content: 'NEW', 
        icon: Sparkles,
        gradient: 'from-amber-400 to-orange-500',
        shadow: 'shadow-amber-500/30'
      });
    }
    
    if (product.is_featured && !hideFeaturedBadge) {
      badgesArray.push({ 
        type: 'featured', 
        content: 'FEATURED', 
        icon: Zap,
        gradient: 'from-orange-400 to-rose-500',
        shadow: 'shadow-orange-500/30'
      });
    }
    
    if (discountPercentage > 0) {
      badgesArray.push({ 
        type: 'discount', 
        content: `-${discountPercentage}%`, 
        icon: null,
        gradient: 'from-emerald-500 to-teal-500',
        shadow: 'shadow-emerald-500/30'
      });
    }
    
    return badgesArray.slice(0, 2);
  }, [isNewProduct, product.is_featured, discountPercentage, hideFeaturedBadge]);

  // Reset image state when product changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [product.id]);

  // Determine if current image should be priority
  const isPriority = useMemo(() => {
    return product.id < 10;
  }, [product.id]);

  return (
    <div 
      className="group relative bg-white rounded-3xl transition-all duration-700 ease-out overflow-hidden h-full flex flex-col"
      style={{
        boxShadow: '0 10px 40px -15px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.02)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Premium gradient overlay on hover */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-3xl"
        style={{ zIndex: 1 }}
      />
      
      {/* Image Section */}
      <div className="relative w-full aspect-square p-4 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        
        {/* Badges - Top left */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <span 
                key={`${badge.type}-${index}`}
                className={`
                  inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 
                  rounded-full bg-gradient-to-r ${badge.gradient} text-white 
                  shadow-lg ${badge.shadow} backdrop-blur-sm
                  transform transition-all duration-300
                `}
              >
                {Icon && <Icon size={10} />}
                {badge.content}
              </span>
            );
          })}
        </div>

        {/* Best Seller - Top right */}
        {(product as any).is_bestseller && (
          <div className="absolute top-3 right-3 z-30">
            <span className="inline-flex items-center gap-1.5 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30 backdrop-blur-sm">
              <Zap size={10} />
              BESTSELLER
            </span>
          </div>
        )}

        {/* Image Container - Single image, no gallery */}
        <div className="relative w-full h-full">
          <Link 
            href={`/products/${product.id}`} 
            className="block w-full h-full cursor-pointer relative z-20"
            onClick={() => onViewTrack && onViewTrack(product.id)}
          >
            <div className="relative w-full h-full">
              
              {/* Loading Skeleton */}
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer rounded-2xl" />
              )}
              
              {/* Product Image */}
              <div 
                className={`
                  relative w-full h-full transition-all duration-500
                  ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                  group-hover:scale-105
                `}
              >
                <Image
                  src={imageUrl}
                  alt={product.name || 'Product image'}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain transition-transform duration-500"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    setImageError(true);
                    setImageLoaded(true);
                  }}
                  loading={isPriority ? undefined : "lazy"}
                  priority={isPriority}
                  quality={90}
                />
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions - Slide up from bottom */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddToWishlist();
            }}
            disabled={isAddingToWishlist}
            className={`
              p-2.5 rounded-full transition-all duration-500 
              backdrop-blur-md border shadow-lg
              ${inWishlist 
                ? 'bg-rose-50 border-rose-200 shadow-rose-500/20' 
                : 'bg-white/90 border-white/50 hover:bg-white hover:shadow-orange-500/20'
              }
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed
              group/btn
            `}
            style={{ transitionDelay: '50ms' }}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isAddingToWishlist ? (
              <div className="h-4 w-4 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
            ) : (
              <Heart
                size={16}
                className={`
                  transition-all duration-300
                  ${inWishlist 
                    ? 'fill-rose-500 text-rose-500 scale-110' 
                    : 'text-gray-700 group-hover/btn:text-rose-500'
                  }
                `}
              />
            )}
          </button>
          
          {/* Quick View Button */}
          <Link
            href={`/products/${product.id}`}
            onClick={() => onViewTrack && onViewTrack(product.id)}
            className={`
              p-2.5 rounded-full transition-all duration-500 
              backdrop-blur-md bg-white/90 border border-white/50 
              hover:bg-white shadow-lg hover:shadow-orange-500/20
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              hover:scale-110 group/btn
            `}
            style={{ transitionDelay: '100ms' }}
            title="Quick View"
          >
            <Eye size={16} className="text-gray-700 group-hover/btn:text-orange-500 transition-colors" />
          </Link>
        </div>

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-gray-100 text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col px-4 pb-4 pt-2 bg-white">
        
        {/* Product Name */}
        <Link 
          href={`/products/${product.id}`} 
          onClick={() => onViewTrack && onViewTrack(product.id)}
          className="group/link mb-2"
        >
          <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 h-10 hover:text-orange-600 transition-all duration-300">
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* Price Section */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              {formatKSH(finalPriceNum)}
            </span>
            {finalPriceNum < price && price > 0 && (
              <span className="text-xs line-through text-gray-400">
                {formatKSH(price)}
              </span>
            )}
          </div>
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="text-[10px] font-bold text-emerald-700">
                -{discountPercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Add to Cart Button - Light green default, warm orange hover */}
        {showActions && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || !isInStock}
            className={`
              relative w-full py-3 px-4 rounded-xl font-semibold text-sm
              transition-all duration-500 ease-out
              flex items-center justify-center gap-2
              overflow-hidden group/btn
              ${isInStock 
                ? 'bg-emerald-500 hover:bg-orange-500 text-white shadow-lg shadow-emerald-500/30 hover:shadow-orange-500/30' 
                : 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
              }
              ${!isAddingToCart && isInStock && 'hover:scale-[0.98] active:scale-[0.96]'}
              disabled:opacity-70 disabled:cursor-not-allowed
            `}
          >
            {isAddingToCart ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={16} className="relative z-10 transition-transform group-hover/btn:scale-110" />
                <span className="font-bold">
                  {!isInStock ? 'Out of Stock' : 'Add to Cart'}
                </span>
                {isInStock && (
                  <Plus 
                    size={14} 
                    className="opacity-0 group-hover/btn:opacity-100 transition-all duration-300 group-hover/btn:translate-x-0 -translate-x-2" 
                  />
                )}
              </>
            )}
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;