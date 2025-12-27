'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Category } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Pagination from '@/components/shared/Pagination';
import { Filter, Grid, List, ChevronDown, Search } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  
  // Initialize filters from URL or defaults
  const [filters, setFilters] = useState(() => {
    return {
      search: searchParams?.get('search') || '',
      category_id: searchParams?.get('category_id') || '',
      min_price: searchParams?.get('min_price') || '',
      max_price: searchParams?.get('max_price') || '',
      in_stock: searchParams?.get('in_stock') === 'true',
      featured: searchParams?.get('featured') === 'true',
      sort: searchParams?.get('sort') || 'created_at',
      order: searchParams?.get('order') || 'desc',
      page: Number(searchParams?.get('page') || '1'),
    };
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories once on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        if (response.data) {
          setCategories(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Build query parameters
        const params: Record<string, any> = {
          page: filters.page,
          per_page: 12,
        };
        
        // Add filters only if they have values
        if (filters.search.trim()) params.search = filters.search.trim();
        if (filters.category_id) params.category_id = filters.category_id;
        if (filters.min_price) params.min_price = filters.min_price;
        if (filters.max_price) params.max_price = filters.max_price;
        if (filters.in_stock) params.in_stock = true;
        if (filters.featured) params.featured = true;
        if (filters.sort) params.sort = filters.sort;
        if (filters.order) params.order = filters.order;
        
        console.log('Fetching products with params:', params);
        
        const response = await api.products.getAll(params);
        
        // Handle API response
        if (response.data) {
          let productsData: Product[] = [];
          let paginationData = pagination;
          
          // Check for different response structures
          if (Array.isArray(response.data)) {
            // Direct array response
            productsData = response.data;
            paginationData = {
              current_page: 1,
              last_page: 1,
              per_page: 12,
              total: response.data.length,
            };
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Laravel paginated response
            productsData = response.data.data;
            if (response.data.meta) {
              paginationData = {
                current_page: response.data.meta.current_page || 1,
                last_page: response.data.meta.last_page || 1,
                per_page: response.data.meta.per_page || 12,
                total: response.data.meta.total || 0,
              };
            } else if (response.data.current_page) {
              paginationData = {
                current_page: response.data.current_page,
                last_page: response.data.last_page || 1,
                per_page: response.data.per_page || 12,
                total: response.data.total || 0,
              };
            }
          } else if (response.data.products && Array.isArray(response.data.products)) {
            // Custom structure with products array
            productsData = response.data.products;
            paginationData = {
              current_page: response.data.current_page || 1,
              last_page: response.data.last_page || 1,
              per_page: response.data.per_page || 12,
              total: response.data.total || response.data.products.length,
            };
          }
          
          console.log('Setting products:', productsData.length);
          console.log('Setting pagination:', paginationData);
          
          setProducts(productsData);
          setPagination(paginationData);
          
          // Update URL with current filters (without page refresh)
          const newParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
              newParams.set(key, String(value));
            }
          });
          
          // Always include page parameter
          newParams.set('page', String(filters.page));
          
          const newUrl = `/products?${newParams.toString()}`;
          router.replace(newUrl, { scroll: false });
          
        } else {
          setError('No data received from server');
          setProducts([]);
        }
        
      } catch (error: any) {
        console.error('Failed to fetch products:', error);
        setError(error.message || 'Failed to load products');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, [filters, router]);

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    console.log(`Filter change: ${key} = ${value}`);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
        ...(key !== 'page' ? { page: 1 } : {}), // Reset to page 1 for non-page changes
      };
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    console.log('Clearing all filters');
    setFilters({
      search: '',
      category_id: '',
      min_price: '',
      max_price: '',
      in_stock: false,
      featured: false,
      sort: 'created_at',
      order: 'desc',
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    console.log(`Page change to: ${page}`);
    handleFilterChange('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar - Mobile/Desktop */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
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

              {/* Availability */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="in_stock"
                    checked={filters.in_stock}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    In Stock Only
                  </span>
                </label>
              </div>

              {/* Featured */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Featured Products Only
                  </span>
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
                      {isLoading ? 'Loading products...' : 
                        pagination.total === 0 ? 'No products found' :
                        `Showing ${Math.min(((pagination.current_page - 1) * pagination.per_page) + 1, pagination.total)}-
                        ${Math.min(pagination.current_page * pagination.per_page, pagination.total)} 
                        of ${pagination.total} products`}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Filter size={20} />
                    Filters
                  </button>

                  {/* View Mode Toggle */}
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

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <select
                      value={sortOptions.find(opt => 
                        opt.sort === filters.sort && opt.order === filters.order
                      )?.value || 'created_at'}
                      onChange={(e) => {
                        const option = sortOptions.find(opt => opt.value === e.target.value);
                        if (option) {
                          handleFilterChange('sort', option.sort);
                          handleFilterChange('order', option.order);
                        }
                      }}
                      className="appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      aria-label="Sort products"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
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
            ) : error ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Error Loading Products
                  </h3>
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
                {/* Products Grid/List */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.map((product) => (
                      <div key={product.id} className="bg-white rounded-lg shadow-sm p-4 flex">
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={product.thumbnail || (product as any).images?.[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                          />
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div>
                              <span className="text-lg font-bold text-gray-900">
                                ${(product.discounted_price || product.price).toFixed(2)}
                              </span>
                              {product.discounted_price && product.discounted_price < product.price && (
                                <span className="ml-2 text-sm text-gray-500 line-through">
                                  ${product.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <button 
                              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                              onClick={() => {
                                // Add to cart logic here
                                console.log('Add to cart:', product.id);
                              }}
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                  <div className="mt-8">
                    <Pagination
                      currentPage={pagination.current_page}
                      totalPages={pagination.last_page}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or filter criteria
                  </p>
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