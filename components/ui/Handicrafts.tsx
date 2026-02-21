'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { ChevronRight, Sparkles, ShoppingBag, ArrowRight, Filter, Heart, PenTool, Scissors, Paintbrush } from 'lucide-react';

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

const HandicraftsPage: React.FC = () => {
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
    fetchHandicraftsCategory();
  }, []);

  useEffect(() => {
    if (category) {
      fetchProducts(1);
    }
  }, [category, selectedSubCategory, sortBy]);

  const fetchHandicraftsCategory = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all categories
      const response = await api.categories.getAll();
      const allCategories = response.data || [];
      
      // Find the Handicrafts & Artisan Goods category (ID: 42)
      const handicraftsCat = allCategories.find((cat: Category) => cat.id === 42);
      
      if (handicraftsCat) {
        setCategory(handicraftsCat);
        
        // Find subcategories (children of ID 42)
        const children = allCategories.filter((cat: Category) => cat.parent_id === 42);
        setSubCategories(children);
      }
      
    } catch (error) {
      console.error('Error fetching handicrafts category:', error);
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
        category_id: selectedSubCategory || 42, // Use subcategory if selected, otherwise main category
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
      const pagination = response.data?.meta;
      
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
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header Skeleton */}
        <div className="relative h-80 bg-gradient-to-r from-orange-800 to-amber-700 overflow-hidden">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="h-14 w-80 bg-white/20 rounded-lg mx-auto mb-4 animate-pulse"></div>
              <div className="h-6 w-96 bg-white/20 rounded-lg mx-auto animate-pulse"></div>
              <div className="h-4 w-64 bg-white/20 rounded-lg mx-auto mt-4 animate-pulse"></div>
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
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Products Skeleton */}
            <div className="lg:w-3/4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
   
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-24 space-y-6">
              {/* Category Feature Card */}
              {category && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg overflow-hidden border border-orange-200">
                  <div className="relative h-48">
                    <Image
                      src={category.image_url || '/images/handicrafts.jpg'}
                      alt={category.name}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <p className="text-sm font-medium">Featured</p>
                      <p className="text-lg font-bold">{category.active_products_count}+ Items</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Artisan Story</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      Each piece tells a story of tradition, skill, and cultural heritage. 
                      Our artisans pour their heart into creating unique treasures that 
                      celebrate African craftsmanship.
                    </p>
                    <div className="flex items-center text-orange-600">
                      <Sparkles size={16} className="mr-2" />
                      <span className="text-sm font-medium">Handmade with love</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Products */}
          <div className="lg:w-3/4">
            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-orange-300 overflow-hidden transition-all duration-300 transform hover:-translate-y-1"
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
                            : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300'
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
                                ? 'bg-orange-500 text-white font-medium'
                                : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
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
                            : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300'
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
                <div className="bg-orange-50 rounded-2xl p-12">
                  <ShoppingBag size={64} className="mx-auto text-orange-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-gray-600 mb-6">
                    We couldn't find any handicrafts in this category.
                  </p>
                  <Link
                    href="/categories"
                    className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Browse All Categories
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Styles */}
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
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HandicraftsPage;