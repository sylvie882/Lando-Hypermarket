'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Eye, Zap, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  onViewTrack?: (productId: number) => void;
}

const wishlistCheckCache = new Map<number, {
  timestamp: number;
  result: boolean;
  promise?: Promise<boolean>;
}>();

// Logo colors configuration
const LOGO_COLORS = {
  dark: '#1a1a1a',
  greenLight: '#9dcc5e',
  greenMedium: '#6a9c3d',
  gold: '#d4af37',
  orange: '#e67e22',
  yellowGold: '#f1c40f',
  red: '#c0392b',
};

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showActions = true,
  onViewTrack
}) => {
  const { isAuthenticated } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [hasCheckedWishlist, setHasCheckedWishlist] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // ========== PRICE CALCULATIONS ==========
  const finalPrice = product.final_price || product.discounted_price || product.price || 0;
  const price = product.price ? parseFloat(String(product.price)) : 0;
  const finalPriceNum = finalPrice ? parseFloat(String(finalPrice)) : 0;
  
  const discountPercentage = useMemo(() => {
    return price > 0 && finalPriceNum < price
      ? Math.round(((price - finalPriceNum) / price) * 100)
      : 0;
  }, [price, finalPriceNum]);

  // ========== STOCK STATUS ==========
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

  // ========== WISHLIST CHECK ==========
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

  // ========== FORMAT CURRENCY ==========
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

  // ========== IMAGE URL ==========
  const imageUrl = useMemo(() => {
    const baseUrl = 'https://api.hypermarket.co.ke';
    const timestamp = product.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    
    // Get the image path
    const imagePath = product.main_image || product.thumbnail;
    
    console.log(`ProductCard ${product.id}: imagePath =`, imagePath);
    
    if (!imagePath) {
      // Use a placeholder service instead of local file
      return `https://via.placeholder.com/400x300/cccccc/666666?text=No+Image`;
    }
    
    // If it's already a full URL, return it with params
    if (imagePath.startsWith('http')) {
      return `${imagePath}${imagePath.includes('?') ? '&' : '?'}t=${timestamp}&w=400&h=300&fit=crop&auto=format`;
    }
    
    // Clean the path
    let cleanPath = imagePath;
    
    // Remove leading slash if present
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Handle the specific format from your API
    if (cleanPath.includes('products/thumbnails/')) {
      // API returns: products/thumbnails/thumbnail-1767070660-69535bc434ad4.png
      // Convert to: storage/products/thumbnails/thumbnail-1767070660-69535bc434ad4.png
      if (!cleanPath.startsWith('storage/')) {
        cleanPath = `storage/${cleanPath}`;
      }
    } else if (!cleanPath.startsWith('storage/')) {
      // Add storage prefix if not present
      cleanPath = `storage/${cleanPath}`;
    }
    
    const finalUrl = `${baseUrl}/${cleanPath}`;
    const urlWithParams = `${finalUrl}${finalUrl.includes('?') ? '&' : '?'}t=${timestamp}&w=400&h=300&fit=crop&auto=format`;
    
    console.log(`ProductCard ${product.id}: finalUrl =`, urlWithParams);
    
    return urlWithParams;
  }, [product.main_image, product.thumbnail, product.updated_at, product.id]);

  // ========== HANDLERS ==========
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

  // ========== BADGES ==========
  const badges = useMemo(() => {
    const badgesArray = [];
    
    if (isNewProduct) {
      badgesArray.push({ 
        type: 'new', 
        content: 'NEW', 
        style: {
          background: `linear-gradient(135deg, ${LOGO_COLORS.greenMedium}, ${LOGO_COLORS.greenLight})`
        }
      });
    }
    
    if (product.is_featured) {
      badgesArray.push({ 
        type: 'featured', 
        content: 'Featured', 
        style: {
          background: `linear-gradient(135deg, ${LOGO_COLORS.orange}, ${LOGO_COLORS.red})`
        }
      });
    }
    
    if (discountPercentage > 0) {
      badgesArray.push({ 
        type: 'discount', 
        content: `-${discountPercentage}%`, 
        style: {
          background: `linear-gradient(135deg, ${LOGO_COLORS.red}, ${LOGO_COLORS.orange})`
        }
      });
    }
    
    return badgesArray.slice(0, 2);
  }, [isNewProduct, product.is_featured, discountPercentage]);

  // Reset image state when product changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [product.id]);

  return (
    <div className="group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-200 overflow-hidden h-full flex flex-col">
      
      {/* BADGES */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {badges.map((badge, index) => (
          <span 
            key={`${badge.type}-${index}`}
            className="text-xs font-bold px-2 py-1 rounded-full shadow text-white"
            style={badge.style}
          >
            {badge.content}
          </span>
        ))}
      </div>

      {/* BEST SELLER BADGE */}
      {(product as any).is_bestseller && (
        <div className="absolute top-2 right-2 z-10">
          <span 
            className="text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1"
            style={{
              background: `linear-gradient(135deg, ${LOGO_COLORS.gold}, ${LOGO_COLORS.orange})`
            }}
          >
            <Zap size={10} />
            Best Seller
          </span>
        </div>
      )}

      {/* PRODUCT IMAGE SECTION */}
      <div className="relative overflow-hidden bg-gray-50">
        <Link 
          href={`/products/${product.id}`} 
          className="block"
          onClick={() => onViewTrack && onViewTrack(product.id)}
        >
          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
            
            {/* Loading Skeleton */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-gray-200 animate-pulse" />
            )}
            
            {/* Product Image */}
            <Image
              src={imageUrl}
              alt={product.name || 'Product image'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-500 ${
                imageLoaded ? 'group-hover:scale-105 opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                console.log(`ProductCard ${product.id}: Image loaded successfully`);
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.error(`ProductCard ${product.id}: Failed to load image:`, imageUrl, e);
                setImageError(true);
                setImageLoaded(true);
              }}
              loading="lazy"
              quality={85}
            />

            {/* QUICK ACTIONS */}
            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToWishlist();
                }}
                disabled={isAddingToWishlist}
                className="bg-white p-1.5 rounded-full shadow hover:bg-gray-50 transition-colors"
                title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={16}
                  className={inWishlist ? 'fill-current' : ''}
                  style={inWishlist ? { color: LOGO_COLORS.red } : undefined}
                />
              </button>
              
              <Link
                href={`/products/${product.id}`}
                onClick={() => onViewTrack && onViewTrack(product.id)}
                className="bg-white p-1.5 rounded-full shadow hover:bg-gray-50 transition-colors"
                title="Quick View"
              >
                <Eye size={16} />
              </Link>
            </div>
          </div>
        </Link>
      </div>

      {/* PRODUCT INFO SECTION */}
      <div className="p-3 flex-1 flex flex-col">
        
        {/* Category */}
        {product.category?.name && (
          <div className="mb-1">
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
              <Tag size={10} />
              {product.category.name}
            </span>
          </div>
        )}

        {/* Product Name */}
        <Link 
          href={`/products/${product.id}`} 
          className="mb-2"
          onClick={() => onViewTrack && onViewTrack(product.id)}
        >
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 h-10" style={{ color: LOGO_COLORS.dark }}>
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* PRICE & CART SECTION */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Final Price */}
              <div className="text-lg font-bold" style={{ color: LOGO_COLORS.dark }}>
                {formatKSH(finalPriceNum)}
              </div>
              
              {/* Original Price (if discounted) */}
              {finalPriceNum < price && price > 0 && (
                <span className="text-sm line-through text-gray-500">
                  {formatKSH(price)}
                </span>
              )}
            </div>
          </div>

          {/* ADD TO CART BUTTON */}
          {showActions && (
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || !isInStock}
              className="w-full text-white py-2 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${LOGO_COLORS.greenMedium}, ${LOGO_COLORS.greenLight})`
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