'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Product, Review } from '@/types';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ProductCard from '@/components/ui/ProductCard';
import { Star, ShoppingCart, Heart, Truck, Shield, RefreshCw, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import ReviewList from '@/components/ReviewList';

// Helper function to format currency in Kenyan Shillings
const formatCurrencyKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format number with thousands separators
const formatNumberKES = (amount: number) => {
  return `KSh ${amount.toLocaleString('en-KE')}`;
};

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

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      const [productRes, reviewsRes, relatedRes] = await Promise.all([
        api.products.getById(productId),
        api.products.getReviews(productId),
        api.products.getRelated(productId)
      ]);

      // Convert string numbers to numbers
      const processedProduct = {
        ...productRes.data,
        rating: parseFloat(productRes.data.rating) || 0,
        price: parseFloat(productRes.data.price),
        discounted_price: productRes.data.discounted_price ? parseFloat(productRes.data.discounted_price) : null,
        stock_quantity: parseInt(productRes.data.stock_quantity),
        review_count: parseInt(productRes.data.review_count || '0'),
        sold_count: parseInt(productRes.data.sold_count || '0'),
      };

      setProduct(processedProduct);
      setReviews(reviewsRes.data.data || []);
      setRelatedProducts(relatedRes.data || []);

      // Check if in wishlist
      if (isAuthenticated) {
        try {
          const wishlistCheck = await api.wishlist.check(processedProduct.id);
          setInWishlist(wishlistCheck.data.in_wishlist);
        } catch (error) {
          // Wishlist check might fail if not logged in, ignore
        }
      }
    } catch (error) {
      console.error('Failed to fetch product details:', error);
      toast.error('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }

    if (!product || product.stock_quantity < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    setAddingToCart(true);
    try {
      await api.cart.addItem({
        product_id: product.id,
        quantity,
      });
      toast.success(`${quantity} ${product.name} added to cart!`);
      return true; // Return success
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      return false; // Return failure
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success) {
      // Navigate to cart page after successful addition
      setTimeout(() => {
        router.push('/cart');
      }, 300);
    }
  };

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      router.push('/login');
      return;
    }

    setAddingToWishlist(true);
    try {
      if (inWishlist) {
        await api.wishlist.remove(product!.id);
        setInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.wishlist.add(product!.id);
        setInWishlist(true);
        toast.success('Added to wishlist!');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  };

  // Helper function to get image URL
  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return '/images/placeholder-product.jpg';
    
    // If already a full URL
    if (imagePath.startsWith('http')) return imagePath;
    
    // Clean path and construct URL
    const cleanPath = imagePath.replace(/^\//, '');
    return `http://localhost:8000/storage/${cleanPath}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Ensure all numbers are numbers
  const finalPrice = (product.discounted_price || product.price);
  const finalPriceNum = typeof finalPrice === 'number' ? finalPrice : parseFloat(finalPrice);
  const priceNum = typeof product.price === 'number' ? product.price : parseFloat(product.price);
  
  const discountPercentage = product.discounted_price
    ? Math.round(((priceNum - finalPriceNum) / priceNum) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-600 mb-8">
          <a href="/" className="hover:text-blue-600">Home</a>
          <ChevronRight size={16} className="mx-2" />
          <a href="/products" className="hover:text-blue-600">Products</a>
          <ChevronRight size={16} className="mx-2" />
          {product.category && (
            <>
              <a href={`/categories/${product.category.slug || product.category.id}`} className="hover:text-blue-600">
                {product.category.name}
              </a>
              <ChevronRight size={16} className="mx-2" />
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
              <div className="relative aspect-square">
                <img
                  src={getImageUrl(product.images?.[selectedImage] || product.thumbnail)}
                  alt={product.name}
                  className="object-contain p-8 w-full h-full"
                />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-blue-500' : 'border-gray-200'}`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} - ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-8">
              {/* Category */}
              {product.category && (
                <a
                  href={`/categories/${product.category.slug || product.category.id}`}
                  className="inline-block text-sm text-blue-600 hover:text-blue-700 mb-2"
                >
                  {product.category.name}
                </a>
              )}

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="ml-2 text-gray-600">
                  {(product.rating || 0).toFixed(1)} ({product.review_count || 0} reviews)
                </span>
                <span className="mx-2">•</span>
                <span className="text-gray-600">{product.sold_count || 0} sold</span>
              </div>

              {/* Price - CHANGED FROM USD TO KES */}
              <div className="mb-6">
                <div className="flex items-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatNumberKES(finalPriceNum)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through ml-3">
                        {formatNumberKES(priceNum)}
                      </span>
                      <span className="ml-3 bg-red-100 text-red-800 text-sm font-bold px-2 py-1 rounded">
                        Save {discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center text-green-600">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium">In Stock</span>
                    <span className="text-gray-600 ml-2">({product.stock_quantity} available)</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="font-medium">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex items-center w-40">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                  >
                    -
                  </button>
                  <div className="w-16 h-12 flex items-center justify-center border-t border-b border-gray-300 text-lg font-medium">
                    {quantity}
                  </div>
                  <button
                    onClick={incrementQuantity}
                    disabled={product && quantity >= product.stock_quantity}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions - Updated with clear buttons */}
              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="group flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart size={24} className="mr-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-lg">{addingToCart ? 'Adding...' : 'Add to Cart'}</div>
                      <div className="text-sm opacity-90 font-normal">Save for later purchase</div>
                    </div>
                  </button>

                  {/* Buy Now Button */}
                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="group flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Package size={24} className="mr-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-lg">Buy Now</div>
                      <div className="text-sm opacity-90 font-normal">Proceed to checkout</div>
                    </div>
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist || !isAuthenticated}
                  className="w-full mt-4 flex items-center justify-center border-2 border-red-500 text-red-600 hover:bg-red-50 py-3 px-6 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                >
                  <Heart
                    size={22}
                    className={`mr-3 ${inWishlist ? 'fill-red-500 text-red-500 animate-pulse' : ''}`}
                  />
                  <span className="text-lg">
                    {addingToWishlist ? 'Updating...' : inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </span>
                </button>
              </div>

              {/* Stock Warning */}
              {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-yellow-800 font-medium">
                      Only {product.stock_quantity} items left in stock!
                    </span>
                  </div>
                </div>
              )}

              {/* Features - UPDATED PRICES TO KES */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Truck size={20} className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Free Delivery</p>
                    <p className="text-xs text-gray-500">On orders over KSh 5,000</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Shield size={20} className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Quality Guarantee</p>
                    <p className="text-xs text-gray-500">100% fresh products</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <RefreshCw size={20} className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Easy Returns</p>
                    <p className="text-xs text-gray-500">30-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Truck size={20} className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Fast Shipping</p>
                    <p className="text-xs text-gray-500">Same-day delivery</p>
                  </div>
                </div>
              </div>

              {/* SKU */}
              <div className="text-sm text-gray-600 border-t border-gray-100 pt-4">
                <span className="font-medium">SKU:</span> <span className="font-mono">{product.sku}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['description', 'reviews', 'specifications'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'reviews' && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {reviews.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-8">
            {activeTab === 'description' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold">Customer Reviews</h3>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Write a Review
                  </button>
                </div>

                {/* Average Rating */}
                <div className="flex items-center mb-8">
                  <div className="text-center mr-8">
                    <div className="text-5xl font-bold">{calculateAverageRating().toFixed(1)}</div>
                    <div className="flex justify-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < Math.floor(calculateAverageRating()) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 mt-1">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center mb-2">
                          <span className="w-10 text-sm text-gray-600">{star} star</span>
                          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-10 text-sm text-gray-600">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <h4 className="font-medium mt-2">{review.user?.name}</h4>
                            <p className="text-gray-600 mt-1">{review.comment}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-xl font-semibold mb-4">Product Specifications</h3>
                {product.attributes ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 py-3">
                        <span className="font-medium text-gray-700">{key}:</span>
                        <span className="ml-2 text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No specifications available for this product.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold mb-8">Related Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;