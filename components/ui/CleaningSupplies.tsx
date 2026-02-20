'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { 
  ChevronRight, Sparkles, ShoppingBag, ArrowRight, Filter, 
  Droplets, Wind, Scissors, SprayCanIcon as Spray, 
  Wrench, Shirt, Trash2, Battery, Brush, DropletIcon
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  image_url: string;
  parent_id: number | null;
  children?: Category[];
  active_products_count?: string;
}

// Cleaning-specific icons for subcategories
const categoryIcons: Record<string, React.ReactNode> = {
  'cleaning-supplies': <Spray className="w-5 h-5" />,
  'cleaning-equipment': <Wrench className="w-5 h-5" />,
  'cleaning-chemicals': <Droplets className="w-5 h-5" />,
  'cleaning-tools': <Brush className="w-5 h-5" />,
  'laundry': <Shirt className="w-5 h-5" />,
  'disposables': <Trash2 className="w-5 h-5" />,
  'batteries': <Battery className="w-5 h-5" />,
  'air-fresheners': <Wind className="w-5 h-5" />,
  'paper-products': <Scissors className="w-5 h-5" />,
  'default': <DropletIcon className="w-5 h-5" />
};

const CleaningSupplies: React.FC = () => {
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchCleaningCategory();
  }, []);

  useEffect(() => {
    if (category) {
      fetchProducts(1);
    }
  }, [category, selectedSubCategory, sortBy]);

  const fetchCleaningCategory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all categories
      const response = await api.categories.getAll();
      const allCategories = response.data || [];
      
      // Find the Cleaning Supplies & Equipment category (ID: 73)
      const cleaningCat = allCategories.find((cat: Category) => cat.id === 73);
      
      if (cleaningCat) {
        setCategory(cleaningCat);
        
        // Find subcategories (children of ID 73)
        const children = allCategories.filter((cat: Category) => cat.parent_id === 73);
        setSubCategories(children);
      }
      
    } catch (error) {
      console.error('Error fetching cleaning category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async (page: number) => {
    try {
      setIsLoading(true);
      
      // Build query params
      const params: any = {
        page,
        per_page: 20,
        category_id: selectedSubCategory || 73, // Use subcategory if selected, otherwise main category
      };
      
      // Add sorting
      switch (sortBy) {
        case 'price_low':
          params.sort = 'price';
          params.order = 'asc';
          break;
        case 'price_high':
          params.sort = 'price';
          params.order = 'desc';
          break;
        case 'newest':
          params.sort = 'created_at';
          params.order = 'desc';
          break;
        case 'popular':
        default:
          params.sort = 'sold_count';
          params.order = 'desc';
          break;
      }
      
      const response = await api.products.getAll(params);
      
      // Handle paginated response
      const productsData = response.data?.data || response.data || [];
      const pagination = response.data?.meta || response.meta;
      
      setProducts(productsData);
      
      if (pagination) {
        setCurrentPage(pagination.current_page || page);
        setTotalPages(pagination.last_page || 1);
        setTotalProducts(pagination.total || productsData.length);
      } else {
        setTotalProducts(productsData.length);
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchProducts(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  // Loading Skeleton
  if (isLoading && !category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        {/* Header Skeleton */}
        <div className="relative h-64 bg-gradient-to-r from-blue-600 to-cyan-600 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-64 bg-white/20 rounded-lg mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 w-96 bg-white/20 rounded-lg mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar Skeleton */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-8 w-40 bg-gray-200 rounded mb-6"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Products Skeleton */}
            <div className="lg:w-3/4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="bg-gray-200 h-40 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section with Category Image */}
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Category Info and Subcategories */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              {/* Category Feature Card */}
              {category && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg overflow-hidden border border-blue-200">
                  <div className="relative h-48">
                    <Image
                      src={category.image_url || '/images/cleaning-categories.jpg'}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-2">Why Choose Our Cleaning Supplies?</h3>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-sm">Professional grade cleaning products</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-sm">Eco-friendly and biodegradable options</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-sm">Commercial and household sizes</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-sm">Complete range of equipment</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Subcategories Filter */}
              {subCategories.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Filter size={18} className="mr-2 text-blue-600" />
                    Shop by Category
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedSubCategory(null)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center ${
                        selectedSubCategory === null
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 mr-3" />
                      <span className="flex-1">All Cleaning Supplies</span>
                    </button>
                    {subCategories.map((subCat) => (
                      <button
                        key={subCat.id}
                        onClick={() => setSelectedSubCategory(subCat.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center ${
                          selectedSubCategory === subCat.id
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-md'
                            : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <span className="mr-3">
                          {categoryIcons[subCat.slug] || categoryIcons.default}
                        </span>
                        <span className="flex-1">{subCat.name}</span>
                        {subCat.active_products_count && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            selectedSubCategory === subCat.id
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {subCat.active_products_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Tips */}
            </div>
          </div>

          {/* Right Side - Products */}
          <div className="lg:w-3/4">
            {/* Sort and Filter Bar */}
           

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="bg-gray-200 h-40 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-blue-300 overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <ProductCard
                        product={product}
                        onViewTrack={trackProductView}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        Previous
                      </button>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-10 h-10 rounded-lg ${
                              currentPage === pageNum
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium'
                                : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-4 py-2 rounded-lg border ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="bg-blue-50 rounded-2xl p-12">
                  <ShoppingBag size={64} className="mx-auto text-blue-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any cleaning products in this category.
                  </p>
                  <Link
                    href="/categories"
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors"
                  >
                    Browse Other Categories
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Styles for Grid */}
      <style jsx global>{`
        @media (max-width: 639px) {
          .grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1023px) {
          .grid {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
        
        @media (min-width: 1024px) {
          .grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CleaningSupplies;