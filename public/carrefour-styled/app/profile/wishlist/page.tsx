// app/profile/wishlist/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  ArrowLeft, 
  Search, 
  Filter,
  Grid,
  List,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';

// Format currency to KSH
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

interface WishlistItem {
  id: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    description: string;
    price: number;
    discounted_price: number | null;
    final_price: number;
    thumbnail: string;
    stock_quantity: number;
    is_in_stock: boolean;
    rating: number;
    review_count: number;
    is_free_shipping: boolean;
    is_featured: boolean;
    category: {
      id: number;
      name: string;
    };
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterInStock, setFilterInStock] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view your wishlist');
      router.push('/auth/login');
      return;
    }
    fetchWishlist();
  }, [isAuthenticated, router]);

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      // First, get the user's token from localStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login again');
        router.push('/auth/login');
        return;
      }

      console.log('Fetching wishlist with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('https://api.hypermarket.co.ke/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Important for cookies/sessions
      });

      console.log('Wishlist response status:', response.status);
      
      if (response.status === 401) {
        toast.error('Your session has expired. Please login again.');
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Wishlist data:', data);
      
      if (data) {
        // Handle different response structures
        if (Array.isArray(data)) {
          setWishlist(data);
        } else if (data.data && Array.isArray(data.data)) {
          setWishlist(data.data);
        } else if (data.wishlist && Array.isArray(data.wishlist)) {
          setWishlist(data.wishlist);
        } else if (data.message) {
          // If the API returns a message like "Wishlist empty"
          console.log(data.message);
          setWishlist([]);
        } else {
          setWishlist([]);
        }
      } else {
        setWishlist([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch wishlist:', error);
      
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error('Please login to view wishlist');
        router.push('/auth/login');
      } else if (error.message?.includes('Network')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to load wishlist');
      }
      
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (wishlistItemId: number, productId: number) => {
    try {
      setRemoving(wishlistItemId);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch(`https://api.hypermarket.co.ke/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        toast.error('Your session has expired. Please login again.');
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove from wishlist');
      }

      // Update local state
      setWishlist(prev => prev.filter(item => item.id !== wishlistItemId));
      toast.success('Removed from wishlist');
    } catch (error: any) {
      console.error('Remove from wishlist error:', error);
      toast.error(error.message || 'Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      setAddingToCart(productId);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const response = await fetch('https://api.hypermarket.co.ke/api/cart/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
        }),
        credentials: 'include',
      });

      if (response.status === 401) {
        toast.error('Your session has expired. Please login again.');
        router.push('/auth/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to cart');
      }

      // Remove from wishlist after adding to cart
      const itemToRemove = wishlist.find(item => item.product_id === productId);
      if (itemToRemove) {
        setWishlist(prev => prev.filter(item => item.id !== itemToRemove.id));
      }
      
      toast.success('Added to cart!');
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleMoveAllToCart = async () => {
    try {
      const inStockItems = filteredWishlist.filter(item => 
        item.product.is_in_stock && item.product.stock_quantity > 0
      );
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      for (const item of inStockItems) {
        const response = await fetch('https://api.hypermarket.co.ke/api/cart/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: item.product_id,
            quantity: 1,
          }),
        });

        if (!response.ok) {
          console.error(`Failed to add item ${item.id} to cart`);
          continue; // Skip this item and continue with others
        }
      }
      
      // Remove in-stock items from wishlist
      setWishlist(prev => 
        prev.filter(item => !item.product.is_in_stock || item.product.stock_quantity <= 0)
      );
      
      toast.success(`Added ${inStockItems.length} items to cart!`);
    } catch (error: any) {
      console.error('Move all to cart error:', error);
      toast.error('Failed to add some items to cart');
    }
  };

  const handleClearWishlist = async () => {
    if (!confirm('Are you sure you want to clear your entire wishlist?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      // Clear wishlist API endpoint
      const response = await fetch('https://api.hypermarket.co.ke/api/wishlist/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // If no clear endpoint, remove items one by one
        for (const item of wishlist) {
          await fetch(`https://api.hypermarket.co.ke/api/wishlist/${item.product_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
      }
      
      // Clear local state
      setWishlist([]);
      toast.success('Wishlist cleared');
    } catch (error: any) {
      console.error('Clear wishlist error:', error);
      toast.error('Failed to clear wishlist');
    }
  };

  // Filter and search functionality
  const filteredWishlist = wishlist.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStock = !filterInStock || item.product.is_in_stock;
    
    return matchesSearch && matchesStock;
  });

  const inStockItems = wishlist.filter(item => item.product.is_in_stock);
  const outOfStockItems = wishlist.filter(item => !item.product.is_in_stock);

  // Helper function to get proper image URL for product thumbnails
  const getProductImageUrl = (thumbnail: string | null | undefined): string => {
    if (!thumbnail) {
      return '/images/placeholder-product.jpg';
    }
    
    // Clean any leading slash
    const cleanThumbnail = thumbnail.replace(/^\//, '');
    
    // Check if it's already a full URL
    if (thumbnail.startsWith('http')) {
      return thumbnail;
    }
    
    // Return full URL to API storage
    return `https://api.hypermarket.co.ke/storage/${cleanThumbnail}`;
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb and Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Heart className="w-8 h-8 mr-3 text-red-500" />
                My Wishlist
              </h1>
              <p className="text-gray-600 mt-2">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
            
            {wishlist.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleMoveAllToCart}
                  disabled={inStockItems.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add All to Cart ({inStockItems.length})
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter Bar */}
        {wishlist.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search in wishlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFilterInStock(!filterInStock)}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    filterInStock
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  In Stock Only
                </button>
                
                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : 'bg-white'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-200' : 'bg-white'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlist Content */}
        {wishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Save items you love by clicking the heart icon on any product.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/products"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                Browse Products
              </Link>
              <Link
                href="/profile"
                className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        ) : filteredWishlist.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No matching items</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filter to find what you&apos;re looking for.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterInStock(false);
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900">{wishlist.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">In Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{inStockItems.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Out of Stock</p>
                    <p className="text-2xl font-bold text-gray-900">{outOfStockItems.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wishlist Items */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWishlist.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden h-full flex flex-col">
                      {/* Product Image */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                        <Link href={`/products/${item.product.id}`} className="block">
                          <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                            <img
                              src={getProductImageUrl(item.product.thumbnail)}
                              alt={item.product.name}
                              className="absolute inset-0 object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => {
                                e.currentTarget.src = '/images/placeholder-product.jpg';
                              }}
                            />
                            
                            {/* Out of Stock Badge */}
                            {!item.product.is_in_stock && (
                              <div className="absolute top-3 right-3 bg-gray-900/90 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-xl z-10">
                                Out of Stock
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        {item.product.category && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                              {item.product.category.name}
                            </span>
                          </div>
                        )}

                        <Link href={`/products/${item.product.id}`} className="group/title mb-2">
                          <h3 className="font-bold text-gray-900 text-base leading-tight group-hover/title:text-green-600 line-clamp-2 min-h-[48px]">
                            {item.product.name}
                          </h3>
                        </Link>

                        {/* Price */}
                        <div className="mt-auto pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-baseline">
                              <span className="text-xl font-bold text-gray-900">
                                {formatCurrency(item.product.final_price)}
                              </span>
                              {item.product.discounted_price && (
                                <span className="text-sm text-gray-500 line-through ml-2">
                                  {formatCurrency(item.product.price)}
                                </span>
                              )}
                            </div>
                            
                            {/* Stock Status */}
                            <div className="text-xs">
                              {item.product.is_in_stock ? (
                                <div className="flex items-center text-green-600 font-medium">
                                  <CheckCircle size={12} className="mr-1" />
                                  In Stock
                                </div>
                              ) : (
                                <div className="text-red-600 font-medium">Out of Stock</div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAddToCart(item.product_id)}
                              disabled={!item.product.is_in_stock || addingToCart === item.product_id}
                              className="flex-1 bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold text-sm disabled:opacity-50 flex items-center justify-center"
                            >
                              {addingToCart === item.product_id ? (
                                <span className="flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  Adding...
                                </span>
                              ) : (
                                <>
                                  <ShoppingCart size={16} className="mr-2" />
                                  Add to Cart
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRemoveFromWishlist(item.id, item.product_id)}
                              disabled={removing === item.id}
                              className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50"
                            >
                              {removing === item.id ? (
                                <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredWishlist.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={getProductImageUrl(item.product.thumbnail)}
                                alt={item.product.name}
                                className="w-16 h-16 rounded-lg object-cover mr-4"
                                onError={(e) => {
                                  e.currentTarget.src = '/images/placeholder-product.jpg';
                                }}
                              />
                              <div>
                                <div className="flex items-center">
                                  <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                                  <Link 
                                    href={`/products/${item.product.id}`}
                                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                                    title="View Product"
                                  >
                                    <ExternalLink className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                  </Link>
                                </div>
                                <p className="text-sm text-gray-500">{item.product.category?.name}</p>
                                <p className="text-sm text-gray-400 line-clamp-1 mt-1 max-w-md">
                                  {item.product.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-gray-900">
                                {formatCurrency(item.product.final_price)}
                              </span>
                              {item.product.discounted_price && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatCurrency(item.product.price)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.product.is_in_stock ? (
                              <div className="flex items-center text-green-600">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                <span>In Stock ({item.product.stock_quantity})</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-red-600">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                <span>Out of Stock</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAddToCart(item.product_id)}
                                disabled={!item.product.is_in_stock || addingToCart === item.product_id}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                              >
                                {addingToCart === item.product_id ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Add to Cart
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRemoveFromWishlist(item.id, item.product_id)}
                                disabled={removing === item.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                title="Remove"
                              >
                                {removing === item.id ? (
                                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Related Suggestions */}
        {wishlist.length > 0 && filteredWishlist.length < 4 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* You can add featured products here */}
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3" />
                <p>Browse more products</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}