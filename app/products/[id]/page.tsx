'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, Review } from '@/types';
import { useAuth } from '@/lib/auth';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ProductCard from '@/components/ui/ProductCard';
import { Star, ShoppingCart, Heart, Truck, Shield, RefreshCw, ChevronRight, Package, Check, ArrowLeft, Share2, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

// Helper function to format currency in Kenyan Shillings
const formatCurrencyKES = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format number with KSh
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
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch product details directly from API
      const productRes = await fetch(`https://api.hypermarket.co.ke/api/products/${productId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!productRes.ok) {
        throw new Error('Product not found');
      }

      const productData = await productRes.json();
      
      // Process product data
      const processedProduct: Product = {
        ...productData.data,
        id: productData.data.id.toString(),
        price: parseFloat(productData.data.price) || 0,
        discounted_price: productData.data.discounted_price ? parseFloat(productData.data.discounted_price) : null,
        rating: parseFloat(productData.data.rating) || 0,
        stock_quantity: parseInt(productData.data.stock_quantity || '0'),
        review_count: parseInt(productData.data.review_count || '0'),
        sold_count: parseInt(productData.data.sold_count || '0'),
        images: productData.data.images || [],
        thumbnail: productData.data.thumbnail || productData.data.images?.[0] || '',
        description: productData.data.description || '',
        sku: productData.data.sku || '',
        category: productData.data.category || null,
        attributes: productData.data.attributes || {},
      };

      setProduct(processedProduct);

      // Fetch reviews directly
      try {
        const reviewsRes = await fetch(`https://api.hypermarket.co.ke/api/products/${productId}/reviews`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      }

      // Fetch related products directly
      try {
        const relatedRes = await fetch(`https://api.hypermarket.co.ke/api/products/${productId}/related`);
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          setRelatedProducts(relatedData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }

      // Check if in wishlist
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('token');
          const wishlistCheck = await fetch(`https://api.hypermarket.co.ke/api/wishlist/check/${processedProduct.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          if (wishlistCheck.ok) {
            const wishlistData = await wishlistCheck.json();
            setInWishlist(wishlistData.data?.in_wishlist || false);
          }
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
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.hypermarket.co.ke/api/cart/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }

      toast.success(`${quantity} ${product.name} added to cart!`);
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Failed to add to cart');
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
      const token = localStorage.getItem('token');
      
      if (inWishlist) {
        // Remove from wishlist
        const response = await fetch(`https://api.hypermarket.co.ke/api/wishlist/items/${product!.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          setInWishlist(false);
          toast.success('Removed from wishlist');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to remove from wishlist');
        }
      } else {
        // Add to wishlist
        const response = await fetch(`https://api.hypermarket.co.ke/api/wishlist/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: JSON.stringify({ product_id: product!.id }),
        });

        if (response.ok) {
          setInWishlist(true);
          toast.success('Added to wishlist!');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add to wishlist');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wishlist');
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
    return `https://api.hypermarket.co.ke/storage/${cleanPath}`;
  };

  const shareProduct = () => {
    if (navigator.share && product) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on Hypermarket`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const submitReview = async (reviewData: { rating: number; comment: string; title?: string }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://api.hypermarket.co.ke/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        toast.success('Review submitted successfully!');
        fetchProductDetails(); // Refresh reviews
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit review');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
      return false;
    }
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Link 
            href="/products"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const finalPrice = product.discounted_price || product.price;
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
          <Link href="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight size={16} className="mx-2" />
          <Link href="/products" className="hover:text-blue-600">Products</Link>
          <ChevronRight size={16} className="mx-2" />
          {product.category && (
            <>
              <Link 
                href={`/categories/${product.category.slug || product.category.id}`} 
                className="hover:text-blue-600"
              >
                {product.category.name}
              </Link>
              <ChevronRight size={16} className="mx-2" />
            </>
          )}
          <span className="text-gray-900 font-medium truncate">{product.name}</span>
        </nav>

        {/* Back Button for Mobile */}
        <button
          onClick={() => router.back()}
          className="lg:hidden flex items-center text-blue-600 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="relative aspect-square">
                {imageLoading && (
                  <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                )}
                <img
                  src={getImageUrl(product.images?.[selectedImage] || product.thumbnail)}
                  alt={product.name}
                  className="object-contain p-4 md:p-8 w-full h-full transition-opacity duration-300"
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-product.jpg';
                    setImageLoading(false);
                  }}
                  style={{ opacity: imageLoading ? 0 : 1 }}
                />
                {discountPercentage > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-lg font-bold">
                    -{discountPercentage}%
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageLoading(true);
                    }}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-blue-500 scale-105' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} - ${index + 1}`}
                      className="object-cover w-full h-full"
                      onError={(e) => e.currentTarget.src = '/images/placeholder-product.jpg'}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Share Button */}
            <button
              onClick={shareProduct}
              className="flex items-center justify-center w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Share2 size={20} className="mr-2" />
              Share Product
            </button>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
              {/* Category & Brand */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {product.category && (
                  <Link
                    href={`/categories/${product.category.slug || product.category.id}`}
                    className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {product.category.name}
                  </Link>
                )}
                {product.attributes?.brand && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {product.attributes.brand}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

              {/* Rating & Sold Count */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center">
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
                </div>
                <span className="hidden md:inline text-gray-300">|</span>
                <div className="flex items-center text-gray-600">
                  <Check size={16} className="mr-1 text-green-500" />
                  {product.sold_count || 0} sold
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">
                    {formatNumberKES(finalPriceNum)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatNumberKES(priceNum)}
                      </span>
                      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-bold rounded-full">
                        Save {discountPercentage}%
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="font-medium text-green-800">In Stock</span>
                    </div>
                    <span className="text-sm text-green-700">
                      {product.stock_quantity} units available
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="font-medium text-red-800">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Quantity
                </label>
                <div className="flex items-center w-fit">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                  >
                    -
                  </button>
                  <div className="w-16 h-12 flex items-center justify-center border-t border-b border-gray-300 text-lg font-medium bg-white">
                    {quantity}
                  </div>
                  <button
                    onClick={incrementQuantity}
                    disabled={product && quantity >= product.stock_quantity}
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold"
                  >
                    +
                  </button>
                  <div className="ml-4 text-sm text-gray-500">
                    Max: {product.stock_quantity} units
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="group flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart size={24} className="mr-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-lg">{addingToCart ? 'Adding...' : 'Add to Cart'}</div>
                      <div className="text-sm opacity-90 font-normal">Save for later</div>
                    </div>
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={addingToCart || product.stock_quantity === 0}
                    className="group flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <Package size={24} className="mr-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="text-lg">Buy Now</div>
                      <div className="text-sm opacity-90 font-normal">Fast checkout</div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToWishlist}
                    disabled={addingToWishlist || !isAuthenticated}
                    className="flex items-center justify-center border-2 border-red-500 text-red-600 hover:bg-red-50 py-3 px-6 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                  >
                    <Heart
                      size={22}
                      className={`mr-3 ${inWishlist ? 'fill-red-500 text-red-500' : ''}`}
                    />
                    <span className="text-lg">
                      {addingToWishlist ? 'Updating...' : inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Product Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <Truck size={20} className="text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Free Delivery</p>
                    <p className="text-xs text-gray-500">Orders over KSh 5,000</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Shield size={20} className="text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Quality Guaranteed</p>
                    <p className="text-xs text-gray-500">Fresh products</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <RefreshCw size={20} className="text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Easy Returns</p>
                    <p className="text-xs text-gray-500">7-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <Clock size={20} className="text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium">Fast Delivery</p>
                    <p className="text-xs text-gray-500">Same-day in Nairobi</p>
                  </div>
                </div>
              </div>

              {/* SKU */}
              <div className="text-sm text-gray-600 border-t border-gray-100 pt-4">
                <span className="font-medium">SKU:</span> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{product.sku}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 overflow-x-auto">
              {[
                { id: 'description', label: 'Description', icon: null },
                { id: 'specifications', label: 'Specifications', icon: <Award size={16} /> },
                { id: 'reviews', label: 'Reviews', icon: <Star size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                  {tab.icon && <span className="mr-2">{tab.icon}</span>}
                  {tab.label}
                  {tab.id === 'reviews' && (
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
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-6">Product Description</h3>
                <div className="prose max-w-none">
                  <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {product.description || 'No description available.'}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <h3 className="text-xl font-semibold mb-6">Product Specifications</h3>
                {product.attributes && Object.keys(product.attributes).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(product.attributes).map(([key, value]) => (
                      <div key={key} className="border-b border-gray-100 py-3">
                        <span className="font-medium text-gray-700 block mb-1">{key}</span>
                        <span className="text-gray-600">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No specifications available for this product.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                  <h3 className="text-xl font-semibold">Customer Reviews</h3>
                  <button 
                    onClick={() => router.push(`/products/${productId}/review`)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Write a Review
                  </button>
                </div>

                {/* Average Rating Summary */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-8 p-6 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-gray-900">{calculateAverageRating().toFixed(1)}</div>
                    <div className="flex justify-center mt-2 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < Math.floor(calculateAverageRating()) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600">{reviews.length} reviews</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reviews.filter(r => Math.round(r.rating) === star).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center mb-2">
                          <span className="w-12 text-sm text-gray-600">{star} ★</span>
                          <div className="flex-1 mx-3 bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-yellow-400 h-2.5 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
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
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                              <span className="ml-3 font-medium">{review.user?.name || 'Anonymous'}</span>
                            </div>
                            <h4 className="font-medium text-gray-900 mb-2">{review.title || 'Great Product!'}</h4>
                            <p className="text-gray-600">{review.comment}</p>
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {new Date(review.created_at).toLocaleDateString('en-KE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Star size={48} className="text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg mb-2">No reviews yet</p>
                      <p className="text-gray-400">Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Related Products</h3>
              <Link 
                href={`/categories/${product.category?.slug || product.category?.id}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All in Category →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
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