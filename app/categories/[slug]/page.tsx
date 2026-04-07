'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Category, Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ShoppingBag, ChevronRight, Home, RefreshCw, AlertCircle, Folder, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  level?: number;
  isExpanded?: boolean;
}

const CategoryPage = () => {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<CategoryWithChildren | null>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategoryProducts, setSubcategoryProducts] = useState<{ [key: number]: Product[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<number>>(new Set());
  const [showSubcategoryProducts, setShowSubcategoryProducts] = useState(false);

  // Build category hierarchy
  const buildCategoryHierarchy = (flatCategories: Category[], parentId: number | null = null): CategoryWithChildren[] => {
    const result: CategoryWithChildren[] = [];
    
    flatCategories
      .filter(cat => cat.parent_id === parentId)
      .forEach(cat => {
        const children = buildCategoryHierarchy(flatCategories, cat.id);
        result.push({
          ...cat,
          children: children.length > 0 ? children : undefined,
          level: parentId === null ? 0 : ((flatCategories.find(c => c.id === parentId) as any)?.level || 0) + 1,
          isExpanded: false
        });
      });
    
    return result.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Find category and its children
  const findCategoryWithChildren = (categories: Category[], targetSlug: string): CategoryWithChildren | null => {
    for (const cat of categories) {
      if (cat.slug === targetSlug || cat.id.toString() === targetSlug) {
        return cat as CategoryWithChildren;
      }
      if ((cat as any).children) {
        const found = findCategoryWithChildren((cat as any).children, targetSlug);
        if (found) return found;
      }
    }
    return null;
  };

  // Fetch products for a specific category
  const fetchProductsForCategory = async (categoryId: number): Promise<Product[]> => {
    try {
      const response = await api.products.getAll({
        category_id: categoryId,
        per_page: 50
      });
      return response.data?.data || response.data || [];
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      return [];
    }
  };

  // Fetch products for all subcategories
  const fetchAllSubcategoryProducts = async (category: CategoryWithChildren) => {
    const productsMap: { [key: number]: Product[] } = {};
    
    const fetchRecursive = async (cat: CategoryWithChildren) => {
      if (cat.children && cat.children.length > 0) {
        for (const child of cat.children) {
          const childProducts = await fetchProductsForCategory(child.id);
          if (childProducts.length > 0) {
            productsMap[child.id] = childProducts;
          }
          await fetchRecursive(child);
        }
      }
    };
    
    await fetchRecursive(category);
    setSubcategoryProducts(productsMap);
  };

  const fetchCategoryAndProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }

      // Fetch all categories
      const categoriesRes = await api.categories.getAll();
      const allCategoriesData = categoriesRes.data || [];
      setAllCategories(allCategoriesData);
      
      // Build hierarchy
      const hierarchy = buildCategoryHierarchy(allCategoriesData);
      
      // Find the target category
      let foundCategory = allCategoriesData.find((cat: Category) => cat.slug === slug);
      
      if (!foundCategory && !isNaN(Number(slug))) {
        foundCategory = allCategoriesData.find((cat: Category) => cat.id.toString() === slug);
      }
      
      if (!foundCategory) {
        notFound();
        return;
      }
      
      // Get category with children
      const categoryWithChildren = findCategoryWithChildren(hierarchy, slug);
      setCategory({
        ...foundCategory,
        children: categoryWithChildren?.children
      });
      
      // Fetch products for the main category
      const mainProducts = await fetchProductsForCategory(foundCategory.id);
      setProducts(mainProducts);
      
      // Fetch products for subcategories
      if (categoryWithChildren?.children && categoryWithChildren.children.length > 0) {
        await fetchAllSubcategoryProducts(categoryWithChildren);
      }
      
    } catch (error: any) {
      console.error('Error fetching category:', error);
      
      if (error.response?.status === 429) {
        setError('Too many requests to the server. Please wait a moment and try again.');
        setRetryCount(prev => prev + 1);
      } else if (error.response?.status === 404) {
        notFound();
      } else {
        setError('Failed to load category. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug, retryCount]);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    }
  }, [slug, fetchCategoryAndProducts]);

  const toggleSubcategory = (categoryId: number) => {
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCategoryAndProducts();
  };

  // Render subcategory tree
  const renderSubcategories = (subcategories: CategoryWithChildren[] = [], level: number = 0) => {
    return subcategories.map(subcat => {
      const isExpanded = expandedSubcategories.has(subcat.id);
      const hasChildren = subcat.children && subcat.children.length > 0;
      const subcatProducts = subcategoryProducts[subcat.id] || [];
      
      return (
        <div key={subcat.id} className="mb-3">
          <div 
            className={`
              flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
              ${level === 0 ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}
              border border-gray-100
            `}
            style={{ marginLeft: `${level * 20}px` }}
            onClick={() => hasChildren && toggleSubcategory(subcat.id)}
          >
            <div className="flex items-center gap-2">
              {hasChildren ? (
                isExpanded ? <FolderOpen size={16} className="text-emerald-600" /> : <Folder size={16} className="text-amber-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">{subcat.name}</span>
              {subcatProducts.length > 0 && (
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                  {subcatProducts.length}
                </span>
              )}
            </div>
            {hasChildren && (
              isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />
            )}
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-2">
              {renderSubcategories(subcat.children, level + 1)}
            </div>
          )}
          
          {!hasChildren && isExpanded && subcatProducts.length > 0 && (
            <div className="mt-2 ml-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {subcatProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
              {subcatProducts.length > 4 && (
                <Link 
                  href={`/categories/${subcat.slug}`}
                  className="text-xs text-emerald-600 hover:underline mt-2 block text-center col-span-full"
                >
                  View all {subcatProducts.length} products →
                </Link>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="border-b border-gray-100">
          <div className="mx-auto px-4 sm:px-6 lg:px-12 py-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/" className="flex items-center gap-1 hover:text-emerald-600"><Home size={14} /><span>Home</span></Link>
              <ChevronRight size={14} />
              <Link href="/categories" className="hover:text-emerald-600">Categories</Link>
              <ChevronRight size={14} />
              <span className="text-gray-900 font-medium truncate">Error</span>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 sm:px-6 lg:px-12 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Error Loading Category</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={handleRetry} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                <RefreshCw size={18} /><span>Try Again</span>
              </button>
              <Link href="/categories" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                <ArrowLeft size={18} /><span>Back to Categories</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    notFound();
  }

  const productCount = category.active_products_count || category.products_count || products.length;
  const hasSubcategories = category.children && category.children.length > 0;

  const getFixedImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('localhost:8000')) return url;
    if (url.includes('localhost/storage/')) return url.replace('localhost/storage/', 'api.hypermarket.co.ke/storage/');
    if (url.startsWith('/storage/')) return `https://api.hypermarket.co.ke${url}`;
    if (!url.startsWith('http')) return `https://api.hypermarket.co.ke/storage/${url.replace('storage/', '')}`;
    return url;
  };

  const getCategoryIcon = (name: string) => {
    const icons: { [key: string]: string } = {
      'Fruits & Vegetables': '🥬', 'Fresh Fruits': '🍎', 'Fresh Vegetables': '🥦', 'Fresh Herbs': '🌿',
      'Meat & Poultry': '🥩', 'Fish & Seafood': '🐟', 'Dairy & Eggs': '🥛', 'Grains, Legumes & Nuts': '🌾',
      'Spices & Seasonings': '🌶️', 'Beverages': '🥤', 'Samosas & Snacks': '🥟', 'Baby Products': '🍼',
      'Cleaning & Household': '🧹', 'Home & Living': '🏠', 'Stationery & Office Supplies': '✏️'
    };
    return icons[name] || '🛒';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="flex items-center gap-1 hover:text-emerald-600"><Home size={14} /><span>Home</span></Link>
            <ChevronRight size={14} />
            <Link href="/categories" className="hover:text-emerald-600">Categories</Link>
            <ChevronRight size={14} />
            <span className="text-gray-900 font-medium truncate">{category.name}</span>
          </div>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-gradient-to-r  border-b border-gray-100">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="md:w-1/5">
              <div className="bg-white rounded-2xl overflow-hidden border border-emerald-200 shadow-md">
                <div className="aspect-square flex items-center justify-center p-6">
                  {category.image_url || category.image ? (
                    <img src={getFixedImageUrl(category.image_url || category.image || '')} alt={category.name}
                      className="w-full h-full object-contain transition-transform duration-500 hover:scale-105"
                      onError={(e) => { e.currentTarget.src = '/images/category-placeholder.jpg'; }}
                      loading="lazy" />
                  ) : (
                    <div className="text-6xl">{getCategoryIcon(category.name)}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:w-4/5">
              <div className="flex items-center gap-2 mb-3">
                {/* {!category.parent_id && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Main Category</span>
                )} */}
                {hasSubcategories && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {category.children?.length} Subcategories
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {category.name}
              </h1>
              
              {category.description && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6 border border-emerald-100">
                  <p className="text-gray-700">{category.description}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <Link href="/categories" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm bg-white border border-emerald-200 px-4 py-2 rounded-lg transition-colors">
                  <ArrowLeft size={16} /><span>Back to categories</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="py-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          
          {/* Subcategories Section */}
          {hasSubcategories && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Folder size={20} className="text-emerald-600" />
                  Subcategories
                </h2>
                <button 
                  onClick={() => setShowSubcategoryProducts(!showSubcategoryProducts)}
                  className="text-sm text-emerald-600 hover:underline"
                >
                  {showSubcategoryProducts ? 'Hide products' : 'Show products'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                {renderSubcategories(category.children || [])}
              </div>
            </div>
          )}

          {/* Main Products */}
          {products.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Products in {category.name}</h2>
                  <p className="text-gray-600 text-sm mt-1">Discover our curated selection</p>
                </div>
                <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                  {products.length} products
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </>
          ) : !hasSubcategories && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <ShoppingBag size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No products available yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">This category doesn't have any products yet. Check back soon or browse other categories.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/categories" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                  <ArrowLeft size={18} /><span>Browse other categories</span>
                </Link>
                <Link href="/products" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  <ShoppingBag size={18} /><span>View all products</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;