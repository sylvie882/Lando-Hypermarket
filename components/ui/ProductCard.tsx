'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ShoppingCart, Heart, Eye, Sparkles, Zap, Plus, Star, ShoppingBag } from 'lucide-react';
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
    if (!imagePath) return `https://via.placeholder.com/400x400/f0fdf4/10b981?text=Product`;
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
      className="group relative bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out"
      style={{
        boxShadow: isHovered
          ? '0 20px 40px -12px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.1)'
          : '0 2px 8px -4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      itemScope
      itemType="https://schema.org/Product"
    >
      {/* Image Section */}
      <div className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-white">
        
        {/* Top Left Badges */}
        <div className="absolute top-2 left-2 z-30 flex flex-col gap-1">
          {isNewProduct && (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg">
              <Sparkles size={8} className="sm:w-[10px] sm:h-[10px]" /> NEW
            </span>
          )}
          {product.is_featured && !hideFeaturedBadge && (
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg">
              <Zap size={8} className="sm:w-[10px] sm:h-[10px]" /> FEATURED
            </span>
          )}
          {discountPercentage > 0 && (
            <span className="inline-flex items-center text-[9px] sm:text-[11px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Bestseller Badge */}
        {(product as any).is_bestseller && (
          <div className="absolute top-2 right-2 z-30">
            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-bold px-2 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg">
              <Star size={8} className="sm:w-[10px] sm:h-[10px] fill-white" /> BEST
            </span>
          </div>
        )}

        {/* Product Image */}
        <Link href={`/products/${product.id}`} className="block w-full h-full" onClick={() => onViewTrack?.(product.id)}>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
          )}
          <div className={`w-full h-full transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-105' : 'scale-100'}`}>
            <Image src={imageUrl} alt={product.name || 'Product'} fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-contain p-4 sm:p-5 transition-transform duration-500"
              onLoad={() => setImageLoaded(true)} onError={() => { setImageError(true); setImageLoaded(true); }}
              loading={isPriority ? undefined : 'lazy'} priority={isPriority} quality={85}
            />
          </div>
        </Link>

        {/* Hover Actions */}
        <div className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 p-3 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToWishlist(); }} disabled={isAddingToWishlist}
            className={`p-2 rounded-full shadow-lg border transition-all duration-200 hover:scale-110 backdrop-blur-sm ${inWishlist ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-white/90 border-gray-200 text-gray-600 hover:text-rose-500 hover:border-rose-200'}`}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}>
            {isAddingToWishlist ? <div className="w-4 h-4 rounded-full border-2 border-rose-300 border-t-rose-500 animate-spin" /> :
              <Heart size={14} className={inWishlist ? 'fill-rose-500' : ''} />}
          </button>
          <Link href={`/products/${product.id}`} onClick={() => onViewTrack?.(product.id)}
            className="p-2 rounded-full bg-white/90 border border-gray-200 shadow-lg text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all duration-200 hover:scale-110 backdrop-blur-sm"
            aria-label="Quick view">
            <Eye size={14} />
          </Link>
        </div>

        {/* Out of Stock Overlay */}
        {!isInStock && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white/95 rounded-full shadow-lg border border-gray-100 text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-3 sm:px-4 pt-2 pb-3 sm:pb-4 bg-white">
        
        {/* Product Name */}
        <Link href={`/products/${product.id}`} onClick={() => onViewTrack?.(product.id)} className="block mb-2">
          <h3 className="text-xs sm:text-sm font-medium text-gray-800 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors" itemProp="name">
            {product.name || 'Unnamed Product'}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between mb-2.5" itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight" itemProp="price" content={String(finalPriceNum)}>
              {formatKSH(finalPriceNum)}
            </span>
            <meta itemProp="priceCurrency" content="KES" />
            {finalPriceNum < price && price > 0 && (
              <span className="text-[10px] sm:text-xs line-through text-gray-400">{formatKSH(price)}</span>
            )}
          </div>
          {discountPercentage > 0 && (
            <span className="text-[9px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-lg">
              SAVE {discountPercentage}%
            </span>
          )}
        </div>

        {/* Add to Cart */}
        {showActions && (
          <button onClick={handleAddToCart} disabled={isAddingToCart || !isInStock}
            className={`relative w-full py-2.5 sm:py-3 px-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 overflow-hidden group/btn
              ${isInStock
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-600/30 active:scale-[0.97]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            aria-label={!isInStock ? 'Out of stock' : `Add ${product.name} to cart`}>
            {isAddingToCart ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Adding…</span>
              </>
            ) : (
              <>
                <ShoppingCart size={13} className="sm:w-[15px] sm:h-[15px] transition-transform group-hover/btn:scale-110" />
                <span>{!isInStock ? 'Out of Stock' : 'Add to Cart'}</span>
                {isInStock && <Plus size={11} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
