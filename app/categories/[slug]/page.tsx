// app/categories/[slug]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ShoppingBag, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

const CategoryPage = () => {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug]);

  const fetchCategoryAndProducts = async () => {
    try {
      setIsLoading(true);
      
      const categoriesRes = await api.categories.getAll();
      const allCategories = categoriesRes.data || [];
      
      let foundCategory = allCategories.find(cat => cat.slug === slug);
      
      if (!foundCategory && !isNaN(Number(slug))) {
        foundCategory = allCategories.find(cat => cat.id.toString() === slug);
      }
      
      if (!foundCategory) {
        notFound();
        return;
      }
      
      setCategory(foundCategory);
      
      try {
        const productsRes = await api.products.getAll({
          category_id: foundCategory.id,
          per_page: 50
        });
        
        const productsData = productsRes.data?.data || productsRes.data || [];
        setProducts(productsData);
      } catch {
        setProducts([]);
      }
      
    } catch {
      notFound();
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const productCount = category.active_products_count || category.products_count || products.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center gap-1 hover:text-green-600">
              <Home size={14} />
              <span>Home</span>
            </Link>
            <ChevronRight size={14} />
            <Link href="/categories" className="hover:text-green-600">
              Categories
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="md:w-1/4">
              <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                <div className="aspect-square flex items-center justify-center p-6">
                  {category.image_url ? (
                    <img
                      src={category.image_url.replace(
                        'http://localhost/storage/',
                        'http://localhost:8000/storage/'
                      )}
                      alt={category.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/images/category-placeholder.jpg';
                      }}
                    />
                  ) : (
                    <div className="text-5xl">
                      {category.name.includes('Fruit') ? '🍎' :
                       category.name.includes('Vegetable') ? '🥦' :
                       category.name.includes('Dairy') ? '🥛' :
                       category.name.includes('Meat') ? '🥩' :
                       category.name.includes('Fish') ? '🐟' :
                       category.name.includes('Poultry') ? '🍗' : '🛒'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:w-3/4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {category.name}
              </h1>
              
              {category.description && (
                <p className="text-gray-600 mb-4">
                  {category.description}
                </p>
              )}

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} className="text-green-600" />
                  <span className="font-medium text-gray-900">
                    {productCount} {productCount === 1 ? 'product' : 'products'}
                  </span>
                </div>
                
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  <ArrowLeft size={16} />
                  <span>Back to categories</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-8">
        <div className="container mx-auto px-4">
          {products.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Products in this category
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {products.length} of {productCount}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No products available
              </h3>
              <p className="text-gray-600 mb-6">
                This category doesn't have any products yet.
              </p>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                <ArrowLeft size={16} />
                <span>Browse other categories</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Related Categories */}
      {products.length > 0 && (
        <div className="py-8 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              You might also like
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: 'Fruits', slug: 'fruits', icon: '🍎' },
                { name: 'Vegetables', slug: 'vegetables', icon: '🥦' },
                { name: 'Dairy', slug: 'dairy-products', icon: '🥛' },
                { name: 'Meat', slug: 'animal-products', icon: '🥩' },
                { name: 'Seafood', slug: 'fish-seafood', icon: '🐟' },
                { name: 'Grains', slug: 'grains-flour', icon: '🌾' },
              ]
              .filter(cat => cat.slug !== category.slug)
              .slice(0, 4)
              .map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="bg-white rounded-lg border border-gray-200 p-3 hover:border-green-300 transition-colors text-center"
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-sm font-medium text-gray-900">
                    {cat.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;