'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Eye, Sparkles, Zap, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  showActions?: boolean;
  onViewTrack?: (productId: number) => void;
  hideFeaturedBadge?: boolean;
}

const wishlistCheckCache = new Map<number, { timestamp: number; result: boolean; promise?: Promise<boolean>; }>();

const ProductCard: React.FC<ProductCardProps> = ({ product, showActions = true, onViewTrack, hideFeaturedBadge = false }) => {
  const { isAuthenticated } = useAuth();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [hasCheckedWishlist, setHasCheckedWishlist] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const finalPrice = product.final_price || product.discounted_price || product.price || 0;
  const price = product.price ? parseFloat(String(product.price)) : 0;
  const finalPriceNum = finalPrice ? parseFloat(String(finalPrice)) : 0;
  
  const discountPercentage = useMemo(() => (
    price > 0 && finalPriceNum < price ? Math.round(((price - finalPriceNum) / price) * 100) : 0
  ), [price, finalPriceNum]);

  const stockQuantity = product.stock_quantity ? (typeof product.stock_quantity === 'number' ? product.stock_quantity : parseInt(String(product.stock_quantity))) : 0;
  const isInStock = product.is_in_stock !== undefined ? Boolean(product.is_in_stock) : stockQuantity > 0;
  const isNewProduct = Boolean((product as any).is_new || (product as any).isNew || (product as any).new_arrival);

  const checkWishlistStatus = useCallback(async (productId: number) => {
    if (!isAuthenticated || hasCheckedWishlist) return;
    const cached = wishlistCheckCache.get(productId);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < 30000) { setInWishlist(cached.result); setHasCheckedWishlist(true); return; }
    try {
      const promise = (async () => {
        try {
          const r = await api.wishlist.check(productId);
          const val = r.data?.in_wishlist || r.data?.is_in_wishlist || false;
          wishlistCheckCache.set(productId, { timestamp: Date.now(), result: val, promise: undefined });
          return val;
        } catch { return false; }
      })();
      wishlistCheckCache.set(productId, { timestamp: now, result: false, promise: promise });
      const result = await promise;
      setInWishlist(result); setHasCheckedWishlist(true);
    } catch { setInWishlist(false); }
  }, [isAuthenticated, hasCheckedWishlist]);

  useEffect(() => {
    if (isAuthenticated && product.id && !hasCheckedWishlist) {
      const t = setTimeout(() => checkWishlistStatus(product.id), Math.random() * 300);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, product.id, hasCheckedWishlist, checkWishlistStatus]);

  useEffect(() => { setImageError(false); setImageLoaded(false); }, [product.id]);

  const formatKSH = useCallback((amount: any) => {
    const n = amount ? parseFloat(String(amount)) : 0;
    if (isNaN(n) || n <= 0) return 'KSh 0';
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n);
  }, []);

  const imageUrl = useMemo(() => {
    const baseUrl = 'https://api.hypermarket.co.ke';
    const ts = product.updated_at ? new Date(product.updated_at).getTime() : Date.now();
    const imagePath = product.main_image || product.thumbnail;
    if (!imagePath) return `https://via.placeholder.com/400x400/E8F0FB/004E9A?text=Product`;
    if (imagePath.startsWith('http')) return `${imagePath}${imagePath.includes('?') ? '&' : '?'}t=${ts}&w=400&h=400&fit=crop`;
    let clean = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    if (!clean.startsWith('storage/')) clean = `storage/${clean}`;
    return `${baseUrl}/${clean}?t=${ts}&w=400&h=400&fit=crop`;
  }, [product.main_image, product.thumbnail, product.updated_at]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); return; }
    if (!isInStock) { toast.error('Product is out of stock'); return; }
    setIsAddingToCart(true);
    try {
      await api.cart.addItem({ product_id: product.id, quantity: 1 });
      toast.success(`${product.name} added to cart!`, { icon: '🛒' });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to add to cart'); }
    finally { setIsAddingToCart(false); }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login to add items to wishlist'); return; }
    setIsAddingToWishlist(true);
    try {
      if (inWishlist) {
        await api.wishlist.remove(product.id);
        setInWishlist(false); wishlistCheckCache.delete(product.id); setHasCheckedWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.wishlist.add(product.id);
        setInWishlist(true); wishlistCheckCache.set(product.id, { timestamp: Date.now(), result: true });
        toast.success('Added to wishlist!', { icon: '❤️' });
      }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to update wishlist'); }
    finally { setIsAddingToWishlist(false); }
  };

  const isPriority = product.id < 10;

  return (
    <article
      className="group relative bg-white flex flex-col transition-all duration-200 ease-out"
      style={{
        borderRadius: '6px',
        boxShadow: isHovered
          ? '0 6px 20px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.08)',
        border: isHovered ? '1px solid #c5d8f0' : '1px solid #e8e8e8',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square overflow-hidden bg-white">
        
        {/* Discount Badge - Carrefour red */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 z-30">
            <span className="text-[10px] sm:text-xs font-black px-2 py-1 text-white" style={{ background: '#E3000B', borderRadius: '3px' }}>
              -{discountPercentage}%
            </span>
          </div>
        )}

        {/* New badge */}
        {isNewProduct && (
          <div className="absolute top-2 left-2 z-30">
            <span className="text-[10px] sm:text-xs font-black px-2 py-1 text-white" style={{ background: '#004E9A', borderRadius: '3px' }}>
              NEW
            </span>
          </div>
        )}

        {/* Featured */}
        {product.is_featured && !hideFeaturedBadge && !isNewProduct && discountPercentage === 0 && (
          <div className="absolute top-2 left-2 z-30">
            <span className="text-[9px] sm:text-[11px] font-black px-2 py-1 text-white" style={{ background: '#FFD100', color: '#1a1a2e', borderRadius: '3px' }}>
              FEATURED
            </span>
          </div>
        )}

        {/* Bestseller */}
        {(product as any).is_bestseller && (
          <div className="absolute top-2 right-2 z-30">
            <span className="text-[9px] sm:text-[11px] font-black px-2 py-1 text-white" style={{ background: '#FFD100', color: '#1a1a2e', borderRadius: '3px' }}>
              ★ BEST
            </span>
          </div>
        )}

        {/* Wishlist button - top right */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToWishlist(); }}
          disabled={isAddingToWishlist}
          className={`absolute top-2 right-2 z-30 p-1.5 rounded-full bg-white shadow-md border transition-all duration-200 ${inWishlist ? 'border-red-200 text-red-500' : 'border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200'}`}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isAddingToWishlist
            ? <div className="w-3 h-3 rounded-full border-2 border-red-300 border-t-red-500 animate-spin" />
            : <Heart size={13} className={inWishlist ? 'fill-red-500' : ''} />
          }
        </button>

        {/* Product Image */}
        <Link href={`/products/${product.id}`} className="block w-full h-full" onClick={() => onViewTrack?.(product.id)}>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          <div className={`w-full h-full transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-105' : 'scale-100'}`}>
            <Image src={imageUrl} alt={product.name || 'Product'} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-contain p-3 sm:p-4 transition-transform duration-300"
              onLoad={() => setImageLoaded(true)} onError={() => { setImageError(true); setImageLoaded(true); }}
              loading={isPriority ? undefined : 'lazy'} priority={isPriority} quality={85}
            />
          </div>
        </Link>

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70">
            <span className="text-xs font-bold px-3 py-1.5 bg-white rounded border border-gray-200 text-gray-600 shadow-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-3 sm:px-3.5 pt-2.5 pb-3 bg-white border-t border-gray-100">
        
        {/* Product Name */}
        <Link href={`/products/${product.id}`} onClick={() => onViewTrack?.(product.id)} className="block mb-2">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug line-clamp-2 hover:text-blue-700 transition-colors" itemProp="name">
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-2.5" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-black text-gray-900" itemProp="price" content={String(finalPriceNum)}>
              {formatKSH(finalPriceNum)}
            </span>
            <meta itemProp="priceCurrency" content="KES" />
            {finalPriceNum < price && price > 0 && (
              <span className="text-[10px] sm:text-xs line-through text-gray-400">{formatKSH(price)}</span>
            )}
          </div>
          {discountPercentage > 0 && (
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#FFF0F0', color: '#E3000B' }}>
              SAVE {discountPercentage}%
            </span>
          )}
        </div>

        {/* Add to Cart - Carrefour blue */}
        {showActions && (
          <button onClick={handleAddToCart} disabled={isAddingToCart || !isInStock}
            className={`relative w-full py-2 sm:py-2.5 px-3 rounded font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5
              ${isInStock
                ? 'text-white hover:opacity-90 active:scale-[0.97]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            style={isInStock ? { background: '#004E9A' } : {}}
            aria-label={!isInStock ? 'Out of stock' : `Add ${product.name} to cart`}>
            {isAddingToCart ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Adding…</span>
              </>
            ) : (
              <>
                <ShoppingCart size={13} className="sm:w-[14px] sm:h-[14px]" />
                <span>{!isInStock ? 'Out of Stock' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
