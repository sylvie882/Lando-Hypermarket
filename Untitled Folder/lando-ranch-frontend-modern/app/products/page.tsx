'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Filter, Grid, List, ChevronDown, Search } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fetchingPageRef = useRef(1);

  const [filters, setFilters] = useState(() => ({
    search: searchParams?.get('search') || '',
    category_id: searchParams?.get('category_id') || '',
    min_price: searchParams?.get('min_price') || '',
    max_price: searchParams?.get('max_price') || '',
    in_stock: searchParams?.get('in_stock') === 'true',
    featured: searchParams?.get('featured') === 'true',
    sort: searchParams?.get('sort') || 'created_at',
    order: searchParams?.get('order') || 'desc',
  }));

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Helper to safely parse prices from API (may come as strings)
  const toPrice = (value: any) => (parseFloat(String(value)) || 0).toFixed(2);

  // Fetch categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        if (response.data) {
          setCategories(Array.isArray(response.data) ? response.data : []);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Core fetch — appends or replaces based on `replace` flag
  const fetchProducts = useCallback(
    async (page: number, replace: boolean) => {
      if (page === 1) setIsLoading(true);
      else setIsFetchingMore(true);
      setError(null);

      try {
        const params: Record<string, any> = { page, per_page: 12 };
        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.min_price) params.min_price = filters.min_price;
        if (filters.max_price) params.max_price = filters.max_price;
        if (filters.in_stock) params.in_stock = true;
        if (filters.featured) params.featured = true;
        if (filters.sort) params.sort = filters.sort;
        if (filters.order) params.order = filters.order;

        const response = await api.products.getAll(params);

        if (response.data) {
          let productsData: Product[] = [];
          let paginationData = { current_page: 1, last_page: 1, per_page: 12, total: 0 };

          if (Array.isArray(response.data)) {
            productsData = response.data;
            paginationData.total = response.data.length;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            productsData = response.data.data;
            const meta = response.data.meta || response.data;
            paginationData = {
              current_page: meta.current_page || 1,
              last_page: meta.last_page || 1,
              per_page: meta.per_page || 12,
              total: meta.total || 0,
            };
          } else if (response.data.products && Array.isArray(response.data.products)) {
            productsData = response.data.products;
            paginationData = {
              current_page: response.data.current_page || 1,
              last_page: response.data.last_page || 1,
              per_page: response.data.per_page || 12,
              total: response.data.total || response.data.products.length,
            };
          }

          setProducts(prev => (replace ? productsData : [...prev, ...productsData]));
          setPagination(paginationData);
          fetchingPageRef.current = paginationData.current_page;

          // Update URL to reflect active filters
          const newParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') newParams.set(key, String(value));
          });
          router.replace(`/products?${newParams.toString()}`, { scroll: false });
        } else {
          setError('No data received from server');
          if (replace) setProducts([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message || 'Failed to load products');
        if (replace) setProducts([]);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [filters, router]
  );

  // Reset & reload from page 1 whenever filters change
  useEffect(() => {
    fetchingPageRef.current = 1;
    fetchProducts(1, true);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // IntersectionObserver: load next page when sentinel enters viewport
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          !isFetchingMore &&
          !isLoading &&
          fetchingPageRef.current < pagination.last_page
        ) {
          fetchProducts(fetchingPageRef.current + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [isFetchingMore, isLoading, pagination.last_page, fetchProducts]);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category_id: '',
      min_price: '',
      max_price: '',
      in_stock: false,
      featured: false,
      sort: 'created_at',
      order: 'desc',
    });
  };

  const sortOptions = [
    { value: 'created_at', label: 'Newest', sort: 'created_at', order: 'desc' },
    { value: 'price_asc', label: 'Price: Low to High', sort: 'price', order: 'asc' },
    { value: 'price_desc', label: 'Price: High to Low', sort: 'price', order: 'desc' },
    { value: 'rating', label: 'Highest Rated', sort: 'rating', order: 'desc' },
    { value: 'sold_count', label: 'Most Popular', sort: 'sold_count', order: 'desc' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Filters Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700">
                  Clear all
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={filters.min_price}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    placeholder="Min"
                    min="0"
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    placeholder="Max"
                    min="0"
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* In Stock */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.in_stock}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">In Stock Only</span>
                </label>
              </div>

              {/* Featured */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Products Only</span>
                </label>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="lg:hidden w-full mt-4 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">All Products</h1>
                  {error ? (
                    <p className="text-red-600 mt-1">{error}</p>
                  ) : (
                    <p className="text-gray-600 mt-1">
                      {isLoading
                        ? 'Loading products...'
                        : pagination.total === 0
                        ? 'No products found'
                        : `Showing ${products.length} of ${pagination.total} products`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Filter size={20} /> Filters
                  </button>

                  {/* View Mode */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                      aria-label="Grid view"
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                      aria-label="List view"
                    >
                      <List size={20} />
                    </button>
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortOptions.find(o => o.sort === filters.sort && o.order === filters.order)?.value || 'created_at'}
                      onChange={(e) => {
                        const option = sortOptions.find(o => o.value === e.target.value);
                        if (option) {
                          setFilters(prev => ({ ...prev, sort: option.sort, order: option.order }));
                        }
                      }}
                      className="appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {sortOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Display */}
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <LoadingSpinner size="lg" />
              </div>
            ) : error && products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Products</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : products.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {products.map((product) => (
                      <div key={product.id} className="h-full">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {products.map((product) => {
                      const displayPrice = parseFloat(String(product.discounted_price || product.price)) || 0;
                      const originalPrice = parseFloat(String(product.price)) || 0;
                      const discountedPrice = parseFloat(String(product.discounted_price)) || 0;
                      const hasDiscount = discountedPrice > 0 && discountedPrice < originalPrice;

                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg shadow-sm p-6 flex flex-col sm:flex-row gap-6 hover:shadow-md transition-shadow duration-300"
                        >
                          {/* Image */}
                          <div className="w-full sm:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={product.thumbnail || (product as any).images?.[0] || '/placeholder-product.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                              onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 flex flex-col">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 hover:text-primary-600 transition-colors duration-300">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-2">
                                Category: {product.category?.name || 'Uncategorized'}
                              </p>
                              <p className="text-gray-600 mt-3 line-clamp-3">{product.description}</p>
                            </div>

                            <div className="flex items-center justify-between mt-auto pt-6">
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl font-bold text-gray-900">
                                    ${toPrice(displayPrice)}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-sm text-gray-500 line-through">
                                      ${toPrice(originalPrice)}
                                    </span>
                                  )}
                                </div>
                                {product.stock_quantity > 0 ? (
                                  <span className="text-sm text-green-600 mt-1">
                                    In Stock ({product.stock_quantity} available)
                                  </span>
                                ) : (
                                  <span className="text-sm text-red-600 mt-1">Out of Stock</span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-300 font-medium"
                                  onClick={() => console.log('Add to cart:', product.id)}
                                >
                                  Add to Cart
                                </button>
                                <button
                                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                                  onClick={() => console.log('Add to wishlist:', product.id)}
                                >
                                  <span className="sr-only">Add to wishlist</span>
                                  ❤️
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="mt-8 flex justify-center py-6">
                  {isFetchingMore && <LoadingSpinner size="md" />}
                  {!isFetchingMore && fetchingPageRef.current >= pagination.last_page && (
                    <p className="text-gray-400 text-sm">You've seen all products</p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your search or filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;