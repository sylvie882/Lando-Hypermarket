'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Review } from '@/types';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ProductCard from '@/components/ui/ProductCard';
import { Star, ShoppingCart, Heart, Truck, Shield, RefreshCw, ChevronRight, Package, Check } from 'lucide-react';
import toast from 'react-hot-toast';

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
  const [imageLoadError, setImageLoadError] = useState<number | null>(null);

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
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success) {
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
    
    if (imagePath.startsWith('http')) return imagePath;
    
    const cleanPath = imagePath.replace(/^\//, '');
    return `https://api.hypermarket.co.ke/storage/${cleanPath}`;
  };

  // Get all available images for the gallery
  const productImages = useMemo(() => {
    if (!product) return [];
    
    const images = [];
    if (product.thumbnail) {
      images.push(getImageUrl(product.thumbnail));
    }
    
    if (product.gallery_urls && product.gallery_urls.length > 0) {
      images.push(...product.gallery_urls);
    } else if (product.images && product.images.length > 0) {
      images.push(...product.images.map(img => getImageUrl(img)));
    }
    
    if (images.length === 0) {
      images.push('/images/placeholder-product.jpg');
    }
    
    return [...new Set(images)];
  }, [product]);

  const handleImageError = (index: number) => {
    setImageLoadError(index);
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
          <a href="/" className="hover:text-orange-600">Home</a>
          <ChevronRight size={16} className="mx-2" />
          <a href="/products" className="hover:text-orange-600">Products</a>
          <ChevronRight size={16} className="mx-2" />
          {product.category && (
            <>
              <a href={`/categories/${product.category.slug || product.category.id}`} className="hover:text-orange-600">
                {product.category.name}
              </a>
              <ChevronRight size={16} className="mx-2" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div>
            {/* Main Image */}
            <div className="bg-white rounded-xl overflow-hidden mb-4">
              <div className="relative aspect-square">
                <img
                  src={productImages[selectedImage]}
                  alt={product.name}
                  className="object-contain p-4 sm:p-6 md:p-8 w-full h-full"
                  onError={() => handleImageError(selectedImage)}
                />
                {imageLoadError === selectedImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">Failed to load image</p>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex space-x-2 sm:space-x-3 overflow-x-auto pb-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 ${selectedImage === index ? 'border-orange-500' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="object-cover w-full h-full"
                        onError={() => handleImageError(index)}
                      />
                      {selectedImage === index && (
                        <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center">
                          <Check size={16} className="text-orange-600" />
                        </div>
                      )}
                      {imageLoadError === index && (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                          <p className="text-xs text-gray-500 p-1">Image</p>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Image Counter */}
            {productImages.length > 1 && (
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-500">
                  {selectedImage + 1} / {productImages.length}
                </span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="bg-white rounded-xl p-6 sm:p-8">
              {/* Category */}
              {product.category && (
                <a
                  href={`/categories/${product.category.slug || product.category.id}`}
                  className="inline-block text-sm font-medium text-orange-600 hover:text-orange-700 mb-2 px-3 py-1 bg-orange-50 rounded-full"
                >
                  {product.category.name}
                </a>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex flex-wrap items-center mb-4 gap-2">
                <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={18}
                        className={i < Math.floor(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-gray-700 font-medium">
                    {(product.rating || 0).toFixed(1)}
                  </span>
                </div>
                <span className="text-gray-600 text-sm sm:text-base">
                  ({product.review_count || 0} reviews)
                </span>
                <span className="hidden sm:inline mx-2 text-gray-400">•</span>
                <span className="text-gray-600 text-sm sm:text-base flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  {product.sold_count || 0} sold
                </span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {formatNumberKES(finalPriceNum)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-lg sm:text-xl text-gray-500 line-through">
                        {formatNumberKES(priceNum)}
                      </span>
                      <span className="bg-orange-100 text-orange-800 text-sm font-bold px-3 py-1 rounded">
                        Save {discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                    <div>
                      <span className="font-bold text-green-700">In Stock</span>
                      <span className="text-gray-600 ml-2">
                        ({product.stock_quantity.toLocaleString()} available)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                    <span className="font-bold text-red-700">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Quantity
                </label>
                <div className="flex items-center w-32 sm:w-40">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
                  >
                    -
                  </button>
                  <div className="w-12 h-10 sm:w-16 sm:h-12 flex items-center justify-center border-t border-b border-gray-300 text-lg font-bold bg-gray-50">
                    {quantity}
                  </div>
                  <button
                    onClick={incrementQuantity}
                    disabled={product && quantity >= product.stock_quantity}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="mb-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="group flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ShoppingCart size={20} className="mr-2 sm:mr-3" />
                    <span>{addingToCart ? 'Adding...' : 'Add to Cart'}</span>
                  </button>

                  {/* Buy Now Button */}
                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="group flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Package size={20} className="mr-2 sm:mr-3" />
                    <span>Buy Now</span>
                  </button>
                </div>

                {/* Wishlist Button */}
                <button
                  onClick={handleAddToWishlist}
                  disabled={addingToWishlist || !isAuthenticated}
                  className={`w-full flex items-center justify-center border-2 py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-semibold disabled:opacity-50 transition-colors ${
                    inWishlist 
                      ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100' 
                      : 'border-red-500 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Heart
                    size={18}
                    className={`mr-2 sm:mr-3 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
                  />
                  <span className="text-sm sm:text-lg">
                    {addingToWishlist ? 'Updating...' : inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </span>
                </button>
              </div>

              {/* Stock Warning */}
              {product.stock_quantity > 0 && product.stock_quantity <= 10 && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                    <span className="text-orange-800 font-bold text-sm sm:text-base">
                      Only {product.stock_quantity} items left in stock!
                    </span>
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Truck size={18} className="text-orange-600 mr-3" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Free Delivery</p>
                    <p className="text-xs text-gray-500">On orders over KSh 5,000</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Shield size={18} className="text-orange-600 mr-3" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Quality Guarantee</p>
                    <p className="text-xs text-gray-500">100% fresh products</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <RefreshCw size={18} className="text-orange-600 mr-3" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Easy Returns</p>
                    <p className="text-xs text-gray-500">30-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Truck size={18} className="text-orange-600 mr-3" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Fast Shipping</p>
                    <p className="text-xs text-gray-500">Same-day delivery</p>
                  </div>
                </div>
              </div>

              {/* SKU */}
              <div className="text-sm text-gray-600 border-t border-gray-100 pt-4 flex items-center">
                <span className="font-bold mr-2">SKU:</span>
                <code className="bg-gray-50 px-3 py-1 rounded font-mono text-gray-800">
                  {product.sku}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 sm:mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto -mb-px">
              {['description', 'reviews', 'specifications'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-shrink-0 py-3 sm:py-4 px-3 sm:px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === tab ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
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

          <div className="mt-6 sm:mt-8">
            {activeTab === 'description' && (
              <div className="bg-white rounded-xl p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Product Description</h3>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                  <h3 className="text-xl font-bold text-gray-900">Customer Reviews</h3>
                  <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors">
                    Write a Review
                  </button>
                </div>

                {/* Average Rating */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-8 gap-6 bg-orange-50 p-6 rounded-lg">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600">
                      {calculateAverageRating().toFixed(1)}
                    </div>
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
                  <div className="flex-1 w-full">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(r => r.rating === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center mb-2">
                          <span className="w-12 text-sm text-gray-600">{star} star</span>
                          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-sm text-gray-600 text-right">{count}</span>
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
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                />
                              ))}
                            </div>
                            <h4 className="font-bold text-gray-900 mt-2">{review.user?.name}</h4>
                            <p className="text-gray-700 mt-1">{review.comment}</p>
                          </div>
                          <span className="text-sm text-gray-500 mt-2 sm:mt-0">
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
              <div className="bg-white rounded-xl p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Product Specifications</h3>
                {product.attributes && Object.keys(product.attributes).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 py-3">
                        <span className="font-bold text-gray-700">{key}:</span>
                        <span className="ml-2 text-gray-600 break-words">{String(value)}</span>
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
          <div className="mt-12 sm:mt-16">
            <h3 className="text-2xl font-bold mb-6 sm:mb-8 text-gray-900">Related Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct.id}>
                  <ProductCard product={relatedProduct} />
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