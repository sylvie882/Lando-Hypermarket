'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Review } from '@/types';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ui/ProductCard';
import {
  Star, ShoppingCart, Heart, Truck, Shield, RefreshCw,
  ChevronRight, Package, Minus, Plus,
  Share2, MessageSquare, ZoomIn, ZoomOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

const formatKES = (amount: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={size}
        className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
    ))}
  </div>
);

// ─── Carrefour-style image magnifier ────────────────────────────────────────
const MagnifierImage: React.FC<{
  src: string;
  alt: string;
  onLoad: () => void;
  onError: () => void;
  loaded: boolean;
  discountPct: number;
}> = ({ src, alt, onLoad, onError, loaded, discountPct }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [transform, setTransform] = useState({ x: 50, y: 50 }); // percent
  const ZOOM = 2.2; // magnification level

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setTransform({ x, y });
  }, []);

  // For touch devices — tap to toggle zoom
  const [touchZoomed, setTouchZoomed] = useState(false);

  return (
    <div
      ref={containerRef}
      className="relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm select-none"
      style={{ cursor: isHovering ? 'zoom-out' : 'zoom-in' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setTransform({ x: 50, y: 50 });
      }}
      onMouseMove={handleMouseMove}
      onClick={() => setTouchZoomed(z => !z)}
    >
      <div className="aspect-square relative overflow-hidden">
        {/* Skeleton shimmer while loading */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-2xl" />
        )}

        {/* The actual image — pans on hover */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          onLoad={onLoad}
          onError={onError}
          style={{
            width: `${isHovering || touchZoomed ? ZOOM * 100 : 100}%`,
            height: `${isHovering || touchZoomed ? ZOOM * 100 : 100}%`,
            objectFit: 'contain',
            padding: isHovering || touchZoomed ? '0' : '2rem',
            position: 'absolute',
            // Shift origin so cursor is always over the same spot on the image
            left: isHovering || touchZoomed
              ? `${-(transform.x * (ZOOM - 1))}%`
              : '0',
            top: isHovering || touchZoomed
              ? `${-(transform.y * (ZOOM - 1))}%`
              : '0',
            transition: isHovering
              ? 'width 0.25s ease, height 0.25s ease, padding 0.25s ease'
              : 'all 0.35s ease',
            opacity: loaded ? 1 : 0,
            willChange: 'left, top',
          }}
        />

        {/* Discount badge */}
        {discountPct > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-br from-red-500 to-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg pointer-events-none">
            -{discountPct}% OFF
          </div>
        )}

        {/* Zoom hint icon — fades when hovering */}
        <div
          className="absolute bottom-4 right-4 z-10 pointer-events-none transition-opacity duration-300"
          style={{ opacity: isHovering ? 0 : 0.6 }}
        >
          <div className="bg-black/20 backdrop-blur-sm text-white rounded-full p-2">
            <ZoomIn size={15} />
          </div>
        </div>

        {/* "Examining…" tooltip */}
        {isHovering && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-3 py-1 rounded-full whitespace-nowrap">
              Move cursor to explore
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────

const ProductDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => { fetchProductDetails(); }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setImageLoaded(false);

      const [productRes, reviewsRes, relatedRes] = await Promise.all([
        api.products.getById(productId),
        api.products.getReviews(productId),
        api.products.getRelated(productId),
      ]);

      const raw = productRes.data?.data ?? productRes.data;

      const p = {
        ...raw,
        rating: parseFloat(raw.rating) || 0,
        price: parseFloat(raw.price),
        discounted_price: raw.discounted_price ? parseFloat(raw.discounted_price) : null,
        stock_quantity: parseInt(raw.stock_quantity),
        review_count: parseInt(raw.review_count || '0'),
        sold_count: parseInt(raw.sold_count || '0'),
      };

      setProduct(p);
      
      // FIX: Ensure reviews is always an array
      let reviewsData = reviewsRes.data?.data || reviewsRes.data;
      if (!Array.isArray(reviewsData)) {
        reviewsData = [];
      }
      setReviews(reviewsData);
      
      // FIX: Ensure related products is always an array
      let relatedData = relatedRes.data?.data || relatedRes.data;
      if (!Array.isArray(relatedData)) {
        relatedData = [];
      }
      setRelatedProducts(relatedData);

      if (isAuthenticated) {
        try {
          const wl = await api.wishlist.check(p.id);
          setInWishlist(wl.data.in_wishlist);
        } catch {}
      }
    } catch (err) {
      console.error('Product fetch error:', err);
      toast.error('Failed to load product details');
      // Set empty arrays on error to prevent the filter error
      setReviews([]);
      setRelatedProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return '/images/placeholder-product.jpg';
    if (path.startsWith('http')) return path;
    return `https://api.hypermarket.co.ke/storage/${path.replace(/^\//, '')}`;
  };

  const productImages = useMemo(() => {
    if (!product) return [];
    const imgs: string[] = [];
    if (product.thumbnail) imgs.push(getImageUrl(product.thumbnail));
    if ((product as any).gallery_urls?.length) imgs.push(...(product as any).gallery_urls);
    else if (product.images?.length)
      imgs.push(...(product.images as any[]).map((i: any) => getImageUrl(typeof i === 'string' ? i : i.url)));
    if (!imgs.length) imgs.push('/images/placeholder-product.jpg');
    return [...new Set(imgs)];
  }, [product]);

  const handleAddToCart = async () => {
    if (!product) return false;
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); router.push('/auth/login'); return false; }
    if (product.stock_quantity === 0) { toast.error('Out of stock'); return false; }
    setAddingToCart(true);
    try {
      await api.cart.addItem({ product_id: product.id, quantity });
      toast.success('Added to cart!');
      return true;
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); return false; }
    finally { setAddingToCart(false); }
  };

  const handleBuyNow = async () => {
    const ok = await handleAddToCart();
    if (ok) setTimeout(() => router.push('/cart'), 300);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); router.push('/auth/login'); return; }
    setAddingToWishlist(true);
    try {
      if (inWishlist) { await api.wishlist.remove(product!.id); setInWishlist(false); toast.success('Removed from wishlist'); }
      else { await api.wishlist.add(product!.id); setInWishlist(true); toast.success('Added to wishlist!'); }
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setAddingToWishlist(false); }
  };

  // FIX: Safe avgRating calculation
  const avgRating = Array.isArray(reviews) && reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  // ── Loading skeleton ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 py-8">
          <div className="h-4 bg-gray-200 rounded w-80 animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            <div>
              <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse mb-4" />
              <div className="flex gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-[72px] h-[72px] bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[24, 32, 20, 48, 40, 40, 40].map((h, i) => (
                <div key={i} className="bg-gray-200 rounded animate-pulse" style={{ height: h }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Product not found</h1>
          <Link href="/products" className="text-emerald-600 hover:underline text-sm">Browse all products</Link>
        </div>
      </div>
    );
  }

  const finalPrice = product.discounted_price || product.price;
  const discountPct = product.discounted_price
    ? Math.round(((product.price - product.discounted_price) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 py-6 md:py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <ChevronRight size={13} className="text-gray-300" />
          <Link href="/products" className="hover:text-emerald-600 transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={13} className="text-gray-300" />
              <Link href={`/categories/${(product.category as any).slug}`} className="hover:text-emerald-600 transition-colors">
                {(product.category as any).name}
              </Link>
            </>
          )}
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-gray-800 font-medium truncate max-w-[180px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ── Images column ── */}
          <div className="space-y-4">

            {/* Main magnifier image */}
            <MagnifierImage
              src={productImages[selectedImage] || '/images/placeholder-product.jpg'}
              alt={product.name}
              loaded={imageLoaded}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              discountPct={discountPct}
            />

            {/* Thumbnail strip */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {productImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedImage(i); setImageLoaded(false); }}
                    className={`relative flex-none rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === i
                        ? 'border-emerald-500 shadow-md shadow-emerald-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ width: 72, height: 72 }}
                  >
                    <img src={img} alt={`view ${i + 1}`} className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}

            {/* Share / WhatsApp */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') navigator.clipboard.writeText(window.location.href);
                  toast.success('Link copied!');
                }}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all"
              >
                <Share2 size={13} /> Share
              </button>
              <a
                href={`https://wa.me/+254716354589?text=${encodeURIComponent('Hi! Interested in: ' + product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-600 px-3 py-2 rounded-xl border border-gray-200 hover:border-green-200 transition-all"
              >
                <MessageSquare size={13} /> Ask on WhatsApp
              </a>
            </div>
          </div>

          {/* ── Product info column ── */}
          <div className="space-y-5">
            {product.category && (
              <Link
                href={`/categories/${(product.category as any).slug}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full hover:bg-emerald-100 transition-colors"
              >
                {(product.category as any).name}
              </Link>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug">{product.name}</h1>

            <div className="flex items-center flex-wrap gap-3">
              <StarRating rating={product.rating} size={18} />
              <span className="text-sm font-semibold text-gray-700">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-400">({product.review_count} reviews)</span>
              <span className="text-gray-200 hidden sm:inline">|</span>
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                {product.sold_count.toLocaleString()} sold
              </span>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-4 border border-gray-100">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-bold text-gray-900">{formatKES(finalPrice)}</span>
                {discountPct > 0 && (
                  <>
                    <span className="text-xl text-gray-400 line-through">{formatKES(product.price)}</span>
                    <span className="text-xs font-bold text-white bg-gradient-to-r from-red-500 to-rose-600 px-2.5 py-1 rounded-lg">
                      Save {discountPct}%
                    </span>
                  </>
                )}
              </div>
              {discountPct > 0 && (
                <p className="text-sm text-emerald-600 font-medium mt-1.5">
                  You save {formatKES(product.price - finalPrice)}
                </p>
              )}
            </div>

            {/* Stock */}
            {product.stock_quantity > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-emerald-700">In Stock</span>
                <span className="text-sm text-gray-400">·</span>
                <span className="text-sm text-gray-500">{product.stock_quantity.toLocaleString()} available</span>
                {product.stock_quantity <= 10 && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full ml-1">
                    Low stock!
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                <span className="text-sm font-bold text-red-600">Out of Stock</span>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
              <div className="inline-flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <div className="w-14 h-12 flex items-center justify-center text-lg font-bold text-gray-900">
                  {quantity}
                </div>
                <button
                  onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 border-emerald-500 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {addingToCart
                    ? <div className="w-4 h-4 rounded-full border-2 border-emerald-300 border-t-emerald-600 animate-spin" />
                    : <ShoppingCart size={15} />}
                  {addingToCart ? 'Adding…' : 'Add to Cart'}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={addingToCart || product.stock_quantity === 0}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-200"
                >
                  <Package size={15} /> Buy Now
                </button>
              </div>
              <button
                onClick={handleWishlist}
                disabled={addingToWishlist}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${
                  inWishlist
                    ? 'bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100'
                    : 'border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50'
                }`}
              >
                <Heart size={15} className={inWishlist ? 'fill-rose-500 text-rose-500' : ''} />
                {addingToWishlist ? 'Updating…' : inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              {[
                { icon: Truck,     label: 'Free Delivery', sub: 'All orders' },
                { icon: Shield,    label: 'Secure Pay',    sub: 'M-Pesa & cards' },
                { icon: RefreshCw, label: 'Easy Returns',  sub: 'Hassle-free' },
              ].map(b => (
                <div key={b.label} className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-gray-100 text-center">
                  <b.icon size={18} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-gray-800 leading-tight">{b.label}</span>
                  <span className="text-[10px] text-gray-400">{b.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex gap-1">
              {['description', 'reviews'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-5 text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {tab === 'reviews' ? `Reviews (${Array.isArray(reviews) ? reviews.length : 0})` : 'Description'}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-6">
            {activeTab === 'description' && (
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">About this product</h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                  {product.description || 'No description available.'}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Customer Reviews</h3>
                  <button className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl hover:bg-emerald-100 transition-colors">
                    Write a Review
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 p-5 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
                  <div className="text-center flex-shrink-0">
                    <div className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
                    <div className="flex justify-center my-2"><StarRating rating={avgRating} size={20} /></div>
                    <p className="text-sm text-gray-500">{Array.isArray(reviews) ? reviews.length : 0} reviews</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {/* FIX: Safety check for reviews array */}
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = Array.isArray(reviews) ? reviews.filter(r => r.rating === star).length : 0;
                      const pct = Array.isArray(reviews) && reviews.length ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-10 text-right">{star} ★</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-4">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-5">
                  {Array.isArray(reviews) && reviews.length > 0 ? reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {review.user?.name?.[0] || 'U'}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{review.user?.name || 'Customer'}</span>
                          </div>
                          <StarRating rating={review.rating} size={13} />
                          <p className="text-sm text-gray-700 mt-2 leading-relaxed">{review.comment}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 mt-1">
                          {new Date(review.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-10">
                      <Star size={36} className="text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No reviews yet — be the first!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Related Products ── */}
        {Array.isArray(relatedProducts) && relatedProducts.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-6">
              <div className="section-accent-bar" />
              <h3 className="text-xl font-bold text-gray-900">You May Also Like</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {relatedProducts.slice(0, 4).map(p => (
                <div key={p.id} className="product-card-wrap">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;