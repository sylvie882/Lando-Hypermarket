'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Cart, CartItem } from '@/types';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

// Add this interface for promo code response
interface Promotion {
  id: number;
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount';
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number | null;
  valid_from: string;
  valid_to: string;
}

interface PromotionValidationResponse {
  valid: boolean;
  message?: string;
  promotion?: Promotion;
  discount_amount?: number;
}

// Format currency to KSH
const formatKSH = (amount: any): string => {
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

// Helper to get proper image URL from API
const getImageUrl = (thumbnail: string | null | undefined): string => {
  if (!thumbnail) {
    return '/images/placeholder-product.jpg';
  }
  
  // Clean any leading slash
  const cleanThumbnail = thumbnail.replace(/^\//, '');
  
  // Check if it's already a full URL
  if (thumbnail.startsWith('http')) {
    return thumbnail;
  }
  
  // Construct proper storage URL
  // Assuming your API is at https://api.hypermarket.co.ke
  return `https://api.hypermarket.co.ke/storage/${cleanThumbnail}`;
};

// Helper to get gallery images
const getGalleryImages = (product: any): string[] => {
  if (!product || !product.images) {
    return [];
  }
  
  // Handle different image formats from API
  const images = [];
  
  if (Array.isArray(product.images)) {
    // If images is an array of strings
    images.push(...product.images);
  } else if (product.images.gallery_images && Array.isArray(product.images.gallery_images)) {
    // If images has gallery_images property
    images.push(...product.images.gallery_images);
  } else if (product.gallery_images && Array.isArray(product.gallery_images)) {
    // If gallery_images is directly on product
    images.push(...product.gallery_images);
  }
  
  // Process each image to get proper URL
  return images.map(img => getImageUrl(img));
};

const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<number[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [selectedProductImages, setSelectedProductImages] = useState<{[key: number]: string[]}>({});

  // Helper function to create empty cart
  const getEmptyCart = (): Cart => ({
    items: [],
    id: 0,
    user_id: 0,
    total: 0,
    item_count: 0
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const response = await api.cart.get();
      setCart(response.data.cart || getEmptyCart());
      
      // Extract gallery images for each product
      const items = response.data.cart?.items || [];
      const imageMap: {[key: number]: string[]} = {};
      
      items.forEach((item: CartItem) => {
        if (item.product) {
          imageMap[item.product.id] = getGalleryImages(item.product);
        }
      });
      
      setSelectedProductImages(imageMap);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
      setCart(getEmptyCart());
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdatingItems(prev => [...prev, itemId]);
    try {
      await api.cart.updateItem(itemId, { quantity: newQuantity });
      await fetchCart(); // Refresh cart
      toast.success('Cart updated');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update cart';
      toast.error(message);
    } finally {
      setUpdatingItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    
    try {
      await api.cart.removeItem(itemId);
      await fetchCart(); // Refresh cart
      toast.success('Item removed from cart');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to remove item';
      toast.error(message);
    }
  };

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }
    
    if (!cart || cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    try {
      setIsApplyingPromo(true);
      
      // Calculate subtotal
      const subtotal = cart.items.reduce((sum, item) => {
        const price = safeParseNumber(item.price);
        const quantity = safeParseNumber(item.quantity);
        return sum + (price * quantity);
      }, 0);
      
      // Check if your API has promotions endpoint
      const response = await api.post<PromotionValidationResponse>('/promotions/validate', {
        code: promoCode.trim(),
        subtotal: subtotal
      });
      
      const data = response.data;
      
      if (data.valid && data.promotion) {
        setAppliedPromo(data.promotion);
        
        // Use discount amount from server if available
        if (data.discount_amount !== undefined) {
          setAppliedDiscount(data.discount_amount);
        } else {
          // Calculate discount client-side as fallback
          let discount = 0;
          if (data.promotion.type === 'percentage') {
            discount = subtotal * (data.promotion.discount_value / 100);
            // Apply max discount if set
            if (data.promotion.max_discount_amount && discount > data.promotion.max_discount_amount) {
              discount = data.promotion.max_discount_amount;
            }
          } else if (data.promotion.type === 'fixed_amount') {
            discount = Math.min(data.promotion.discount_value, subtotal);
          }
          setAppliedDiscount(discount);
        }
        
        toast.success(`Promo code applied! Discount: ${formatKSH(appliedDiscount)}`);
      } else {
        toast.error(data.message || 'Invalid promo code');
        removePromoCode();
      }
    } catch (error: any) {
      console.error('Promo code error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to apply promo code';
      toast.error(message);
      removePromoCode();
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setAppliedDiscount(0);
    setPromoCode('');
  };

  const clearCart = async () => {
    if (!cart || cart.items.length === 0) return;
    
    if (!confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      await api.cart.clear();
      setCart(getEmptyCart());
      removePromoCode();
      toast.success('Cart cleared');
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to clear cart';
      toast.error(message);
    }
  };

  // Helper function to safely parse numbers
  const safeParseNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    return isNaN(num) ? 0 : num;
  };

  // Helper function to calculate item total
  const calculateItemTotal = (item: CartItem): number => {
    const price = safeParseNumber(item.price);
    const quantity = safeParseNumber(item.quantity);
    return price * quantity;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Please Login</h1>
          <p className="text-gray-600 mb-6">Login to view your shopping cart</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const cartItems = cart?.items || [];
  
  if (!cart || cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <ShoppingBag size={64} className="mx-auto text-gray-300 mb-6" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Add some items to get started!</p>
            <Link
              href="/products"
              className="inline-flex items-center justify-center bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={20} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals - FREE DELIVERY, NO VAT
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + calculateItemTotal(item);
  }, 0);
  
  const shipping = 0; // FREE DELIVERY
  const tax = 0; // NO VAT
  const total = Math.max(0, subtotal + shipping + tax - appliedDiscount);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'} in Cart
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700 hover:underline transition-colors"
                    disabled={cartItems.length === 0}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => {
                  const imageUrl = getImageUrl(item.product?.thumbnail);
                  const galleryImages = selectedProductImages[item.product?.id || 0] || [];
                  const itemTotal = calculateItemTotal(item);
                  const isUpdating = updatingItems.includes(item.id);
                  const stockQuantity = safeParseNumber(item.product?.stock_quantity);
                  
                  return (
                    <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex flex-col sm:flex-row">
                        {/* Product Image */}
                        <div className="flex-shrink-0 mb-4 sm:mb-0 sm:mr-6">
                          <div className="w-full sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                            <img
                              src={imageUrl}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('Image failed to load:', imageUrl);
                                e.currentTarget.src = '/images/placeholder-product.jpg';
                              }}
                              loading="lazy"
                            />
                            {stockQuantity === 0 && (
                              <div className="absolute inset-0 bg-red-500 bg-opacity-75 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">Out of Stock</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Gallery Images Thumbnails */}
                          {galleryImages.length > 0 && (
                            <div className="flex mt-2 space-x-1 overflow-x-auto">
                              {galleryImages.slice(0, 3).map((img, index) => (
                                <div key={index} className="w-8 h-8 flex-shrink-0">
                                  <img
                                    src={img}
                                    alt={`Gallery ${index + 1}`}
                                    className="w-full h-full object-cover rounded"
                                    onError={(e) => {
                                      e.currentTarget.src = '/images/placeholder-product.jpg';
                                    }}
                                  />
                                </div>
                              ))}
                              {galleryImages.length > 3 && (
                                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded text-xs">
                                  +{galleryImages.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <div className="mb-4 sm:mb-0">
                              <Link
                                href={`/products/${item.product?.id}`}
                                className="font-medium text-gray-900 hover:text-green-600 text-lg transition-colors"
                              >
                                {item.product?.name || 'Product'}
                              </Link>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.product?.category?.name || 'Uncategorized'}
                              </p>
                              <p className="text-sm text-gray-500">
                                Price: {formatKSH(item.price)} each
                              </p>
                              <p className="text-sm text-gray-500">
                                SKU: {item.product?.sku || 'N/A'}
                              </p>
                              {stockQuantity < 10 && stockQuantity > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  Only {stockQuantity} left in stock!
                                </p>
                              )}
                            </div>
                            <div className="text-left sm:text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatKSH(itemTotal)}
                              </div>
                              {item.price !== item.product?.price && (
                                <p className="text-sm text-gray-500 line-through">
                                  Original: {formatKSH(item.product?.price)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={isUpdating || item.quantity <= 1}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-12 h-8 flex items-center justify-center border-t border-b border-gray-300 bg-gray-50">
                                {isUpdating ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                ) : (
                                  item.quantity
                                )}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={isUpdating || item.quantity >= stockQuantity}
                                className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                              <span className="ml-2 text-sm text-gray-500">
                                Max: {stockQuantity}
                              </span>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors disabled:opacity-50"
                              title="Remove item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center text-green-600 hover:text-green-700 font-medium hover:underline transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Tag size={16} className="mr-2 text-gray-500" />
                  <label className="text-sm font-medium text-gray-700">
                    Promo Code
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    disabled={!!appliedPromo || isApplyingPromo}
                  />
                  {appliedPromo ? (
                    <button
                      onClick={removePromoCode}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 min-w-[80px] flex items-center justify-center"
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={applyPromoCode}
                      disabled={isApplyingPromo || !promoCode.trim()}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 min-w-[80px] flex items-center justify-center"
                    >
                      {isApplyingPromo ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        'Apply'
                      )}
                    </button>
                  )}
                </div>
                {appliedPromo && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Tag size={14} className="mr-2 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {appliedPromo.code} applied!
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-800">
                        -{formatKSH(appliedDiscount)}
                      </span>
                    </div>
                    {appliedPromo.name && (
                      <p className="text-xs text-green-600 mt-1">{appliedPromo.name}</p>
                    )}
                    {appliedPromo.type === 'percentage' && (
                      <p className="text-xs text-green-600">
                        {appliedPromo.discount_value}% off
                        {appliedPromo.max_discount_amount && (
                          ` (max ${formatKSH(appliedPromo.max_discount_amount)})`
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Summary Details */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">{formatKSH(subtotal)}</span>
                </div>
                
                {/* FREE DELIVERY */}
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-medium">Delivery</span>
                  <span className="font-bold">FREE</span>
                </div>
                
                {appliedDiscount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="font-medium">Discount</span>
                    <span className="font-bold">-{formatKSH(appliedDiscount)}</span>
                  </div>
                )}
                
                <hr className="my-4 border-gray-300" />
                <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>{formatKSH(total)}</span>
                </div>
                
                {/* FREE DELIVERY MESSAGE */}
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <span className="text-green-600 font-medium text-sm">🎉 Free Delivery on All Orders</span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Enjoy free delivery to your doorstep on every order
                  </p>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="space-y-4">
                <Link
                  href="/checkout"
                  className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </Link>
                
                <Link
                  href="/products"
                  className="block w-full text-center border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              {/* Payment Methods */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-500 mb-3">Secure checkout with</p>
                <div className="flex justify-center items-center gap-6">
                  <div className="text-xl" title="Credit Cards">💳</div>
                  <div className="text-xl" title="Bank Transfer">🏦</div>
                  <div className="text-xl" title="M-Pesa">📱</div>
                  <div className="text-xl" title="PayPal">💰</div>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                  256-bit SSL encryption • Your data is secure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;