'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Product, Category, PaginatedResponse } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Pagination from '@/components/shared/Pagination';
import { Filter, Grid, List, ChevronDown, Search, X } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 12,
    total: 0,
  });
  
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    in_stock: searchParams.get('in_stock') === 'true',
    featured: searchParams.get('featured') === 'true',
    sort: searchParams.get('sort') || 'created_at',
    order: searchParams.get('order') || 'desc',
    page: Number(searchParams.get('page')) || 1,
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await api.categories.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = {
        search: filters.search,
        category_id: filters.category_id,
        min_price: filters.min_price,
        max_price: filters.max_price,
        in_stock: filters.in_stock,
        featured: filters.featured,
        sort: filters.sort,
        order: filters.order,
        page: filters.page,
        per_page: 12,
      };
      
      // Remove empty params
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === false || params[key] === 0) {
          delete params[key];
        }
      });
      
      console.log('Fetching products with params:', params);
      
      const response = await api.products.getAll(params);
      console.log('Products API Response:', response);
      
      // Handle different API response structures
      let productsData: Product[] = [];
      let paginationData = {
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0,
      };
      
      if (response.data) {
        // Case 1: Laravel paginated response
        if (response.data.data && Array.isArray(response.data.data)) {
          productsData = response.data.data;
          if (response.data.meta) {
            paginationData = {
              current_page: response.data.meta.current_page || response.data.current_page || 1,
              last_page: response.data.meta.last_page || response.data.last_page || 1,
              per_page: response.data.meta.per_page || response.data.per_page || 12,
              total: response.data.meta.total || response.data.total || 0,
            };
          } else {
            paginationData = {
              current_page: response.data.current_page || 1,
              last_page: response.data.last_page || 1,
              per_page: response.data.per_page || 12,
              total: response.data.total || 0,
            };
          }
        }
        // Case 2: Direct array response
        else if (Array.isArray(response.data)) {
          productsData = response.data;
          paginationData = {
            current_page: 1,
            last_page: 1,
            per_page: response.data.length,
            total: response.data.length,
          };
        }
        // Case 3: Direct object with products array
        else if (response.data.products && Array.isArray(response.data.products)) {
          productsData = response.data.products;
          paginationData = {
            current_page: response.data.current_page || 1,
            last_page: response.data.last_page || 1,
            per_page: response.data.per_page || 12,
            total: response.data.total || response.data.products.length || 0,
          };
        }
      }
      
      console.log('Processed products:', productsData.length);
      console.log('Processed pagination:', paginationData);
      
      setProducts(productsData);
      setPagination(paginationData);
      
      // Update URL with current filters
      const newParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== '') {
          newParams.set(key, String(value));
        }
      });
      
      // Always include page parameter
      newParams.set('page', String(filters.page));
      
      const newUrl = `/products?${newParams.toString()}`;
      console.log('Updating URL to:', newUrl);
      router.push(newUrl, { scroll: false });
      
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      // Set empty products on error
      setProducts([]);
      setPagination(prev => ({
        ...prev,
        current_page: 1,
        total: 0,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    console.log(`Filter changed: ${key} = ${value}`);
    
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
        ...(key !== 'page' ? { page: 1 } : {}), // Reset to page 1 for filter changes
      };
      
      console.log('New filters:', newFilters);
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
    console.log(`Changing to page ${page}`);
    handleFilterChange('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sortOptions = [
    { value: 'created_at', label: 'Newest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'sold_count', label: 'Most Popular' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
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
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={filters.max_price}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    placeholder="Max"
                    className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="in_stock"
                    checked={filters.in_stock}
                    onChange={(e) => handleFilterChange('in_stock', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="in_stock" className="ml-2 text-sm text-gray-700">
                    In Stock Only
                  </label>
                </div>
              </div>

              {/* Featured */}
              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={filters.featured}
                    onChange={(e) => handleFilterChange('featured', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
                    Featured Products Only
                  </label>
                </div>
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
                  <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                  <p className="text-gray-600 mt-1">
                    {isLoading ? 'Loading...' : 
                      pagination.total === 0 ? 'No products found' :
                      `Showing ${((pagination.current_page - 1) * pagination.per_page) + 1}-
                      ${Math.min(pagination.current_page * pagination.per_page, pagination.total)} 
                      of ${pagination.total} products`}
                  </p>
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

                  {/* View Mode */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : 'bg-white'}`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : 'bg-white'}`}
                    >
                      <List size={20} />
                    </button>
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={filters.sort === 'price_desc' ? 'price_desc' : `${filters.sort}_${filters.order}`}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'price_desc') {
                          handleFilterChange('sort', 'price');
                          handleFilterChange('order', 'desc');
                        } else {
                          const [sort, order] = value.split('_');
                          handleFilterChange('sort', sort);
                          handleFilterChange('order', order);
                        }
                      }}
                      className="appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {sortOptions.map((option) => (
                        <option 
                          key={option.value} 
                          value={option.value === 'price_desc' ? 'price_desc' : `${option.value}_asc`}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <LoadingSpinner size="lg" />
              </div>
            ) : products.length > 0 ? (
              <>
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
                            src={product.thumbnail || product.images?.[0] || '/placeholder-product.jpg'}
                            alt={product.name}
                            className="w-full h-full object-cover"
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
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination - Only show if there are multiple pages */}
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