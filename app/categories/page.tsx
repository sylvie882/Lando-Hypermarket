// app/categories/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/types';
import CategoryCard from '@/components/ui/CategoryCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { 
  Search, 
  Filter, 
  Grid2x2, 
  List, 
  Sparkles,
  ShoppingBag,
  ChevronDown,
  Tag,
  Hash,
  ArrowUpDown,
  ChevronRight,
  Folder,
  FolderOpen
} from 'lucide-react';

interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
  level?: number;
  isExpanded?: boolean;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hierarchicalCategories, setHierarchicalCategories] = useState<CategoryWithChildren[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'hierarchy'>('hierarchy');
  const [sortBy, setSortBy] = useState<'name' | 'products' | 'id'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (viewMode === 'hierarchy') {
      // Build hierarchical structure
      const hierarchy = buildCategoryHierarchy(categories);
      setHierarchicalCategories(hierarchy);
    } else {
      // Filter and sort for grid/list view
      let result = [...categories];
      
      if (searchQuery) {
        result = result.filter(category =>
          category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      result.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'products':
            aValue = a.active_products_count || a.products_count || 0;
            bValue = b.active_products_count || b.products_count || 0;
            break;
          case 'id':
            aValue = a.id;
            bValue = b.id;
            break;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
      
      setFilteredCategories(result);
    }
  }, [categories, searchQuery, sortBy, sortOrder, viewMode]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.categories.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Build hierarchical category structure
  const buildCategoryHierarchy = (flatCategories: Category[]): CategoryWithChildren[] => {
    const categoryMap = new Map<number, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    // First, create a map of all categories
    flatCategories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [], level: 0, isExpanded: false });
    });

    // Build the tree structure
    flatCategories.forEach(cat => {
      const categoryNode = categoryMap.get(cat.id);
      if (categoryNode) {
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          const parent = categoryMap.get(cat.parent_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(categoryNode);
            categoryNode.level = (parent.level || 0) + 1;
          }
        } else {
          roots.push(categoryNode);
        }
      }
    });

    // Sort children recursively
    const sortChildren = (nodes: CategoryWithChildren[]) => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortChildren(node.children);
        }
      });
    };
    sortChildren(roots);

    return roots;
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Render hierarchical view
  const renderHierarchy = (categories: CategoryWithChildren[], level: number = 0) => {
    return categories.map(category => {
      const isExpanded = expandedCategories.has(category.id);
      const hasChildren = category.children && category.children.length > 0;
      const productCount = category.active_products_count || category.products_count || 0;
      
      return (
        <div key={category.id} className="select-none">
          <div 
            className={`
              flex items-center justify-between p-4 
              ${level === 0 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500' : 'bg-white'}
              hover:bg-gray-50 transition-all duration-200 rounded-lg mb-1 cursor-pointer
              shadow-sm border border-gray-100
            `}
            style={{ marginLeft: `${level * 24}px` }}
            onClick={() => hasChildren && toggleCategory(category.id)}
          >
            <div className="flex items-center gap-3 flex-1">
              {hasChildren ? (
                isExpanded ? (
                  <FolderOpen size={20} className="text-green-600 flex-shrink-0" />
                ) : (
                  <Folder size={20} className="text-amber-600 flex-shrink-0" />
                )
              ) : (
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`
                    font-semibold
                    ${level === 0 ? 'text-lg text-green-800' : 'text-gray-800'}
                  `}>
                    {category.name}
                  </span>
                  {category.slug && (
                    <span className="text-xs text-gray-400 font-mono">({category.slug})</span>
                  )}
                  {category.parent_id && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
                      Subcategory
                    </span>
                  )}
                </div>
                {category.description && (
                  <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                  <ShoppingBag size={14} className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{productCount}</span>
                </div>
                
                {hasChildren && (
                  <ChevronRight 
                    size={18} 
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                )}
              </div>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-1">
              {renderHierarchy(category.children || [], level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const getStats = () => {
    const totalCategories = categories.length;
    const topLevelCategories = categories.filter(c => !c.parent_id).length;
    const categoriesWithImages = categories.filter(c => c.image || c.image_url).length;
    const totalProducts = categories.reduce((sum, cat) => 
      sum + (cat.active_products_count || cat.products_count || 0), 0
    );
    
    return { totalCategories, topLevelCategories, categoriesWithImages, totalProducts };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="mx-auto px-4 sm:px-6 lg:px-12 py-16 md:py-24 relative">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full mb-8">
              <Sparkles size={20} />
              <span className="text-sm font-semibold">Browse Collections</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Shop by <span className="text-yellow-300">Categories</span>
            </h1>
            
            <p className="text-2xl md:text-3xl mb-10 text-white/95 max-w-3xl">
              Explore our wide range of premium farm-fresh products organized for your convenience
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" size={22} />
                <input
                  type="text"
                  placeholder="Search categories (e.g., Fruits, Vegetables, Dairy...)"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-green-500/30 shadow-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path fill="#ffffff" fillOpacity="1" d="M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,112C672,96,768,96,864,122.7C960,149,1056,203,1152,213.3C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="mx-auto px-4 sm:px-6 lg:px-12">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">{stats.totalCategories}</div>
              <div className="text-sm text-gray-500">Total Categories</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">{stats.topLevelCategories}</div>
              <div className="text-sm text-gray-500">Main Categories</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">{stats.totalProducts}</div>
              <div className="text-sm text-gray-500">Total Products</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-2xl font-bold text-green-600">{stats.categoriesWithImages}</div>
              <div className="text-sm text-gray-500">With Images</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('hierarchy')}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'hierarchy' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Hierarchy View"
                >
                  <Folder size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <Grid2x2 size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-green-100 text-green-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List size={20} />
                </button>
              </div>
              
              <div className="text-sm text-gray-600">
                Showing <span className="font-bold text-gray-900">
                  {viewMode === 'hierarchy' 
                    ? hierarchicalCategories.length 
                    : filteredCategories.length}
                </span> categories
              </div>
            </div>
            
            {viewMode !== 'hierarchy' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={18} className="text-gray-500" />
                  <select
                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="name">Sort by Name</option>
                    <option value="products">Sort by Products</option>
                    <option value="id">Sort by Newest</option>
                  </select>
                </div>
                
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-300 shadow-sm"
                >
                  <span>{sortOrder === 'asc' ? 'A → Z' : 'Z → A'}</span>
                  <ChevronDown size={16} className={`transition-transform duration-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>
          
          {/* Categories Display */}
          {viewMode === 'hierarchy' ? (
            // Hierarchy View
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
                <h2 className="text-white font-bold text-xl flex items-center gap-2">
                  <Folder size={24} />
                  Category Hierarchy
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Click on categories with folders to expand and view subcategories
                </p>
              </div>
              <div className="p-6">
                {hierarchicalCategories.length > 0 ? (
                  renderHierarchy(hierarchicalCategories)
                ) : (
                  <div className="text-center py-12">
                    <Folder size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No categories found</p>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {filteredCategories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-6">
              {filteredCategories.map((category) => (
                <div 
                  key={category.id}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-gray-100 overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-1/4 relative">
                      <div className="aspect-square md:aspect-auto md:h-full">
                        {category.image_url ? (
                          <img
                            src={category.image_url.replace(
                              'https://api.hypermarket.co.ke/',
                              'https://api.hypermarket.co.ke/storage/'
                            )}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                              e.currentTarget.src = '/images/category-placeholder.jpg';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-5xl">🛒</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="md:w-3/4 p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {!category.parent_id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Main Category
                              </span>
                            )}
                            {category.parent_id && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                Subcategory
                              </span>
                            )}
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300 mb-3">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-gray-600 leading-relaxed mb-4">
                              {category.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2">
                              <ShoppingBag size={18} className="text-gray-500" />
                              <span className="text-gray-700 font-semibold">
                                {category.active_products_count || category.products_count || 0} products
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Tag size={18} className="text-gray-500" />
                              <span className="text-gray-700">
                                {category.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <a
                            href={`/categories/${category.slug || category.id}`}
                            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-md group/btn"
                          >
                            Browse Products
                            <span className="group-hover/btn:translate-x-1 transition-transform duration-300">→</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Empty State */}
          {((viewMode === 'hierarchy' && hierarchicalCategories.length === 0) ||
            (viewMode !== 'hierarchy' && filteredCategories.length === 0)) && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-2xl mb-6 mx-auto">
                <Search size={48} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No categories found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                {searchQuery ? `No categories match "${searchQuery}". Try searching for something else.` : 'No categories available at the moment.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors duration-300 shadow-md"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Can't Find What You're Looking For?
            </h2>
            
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Contact our support team or browse our full product catalog
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a
                href="/products"
                className="group inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 text-lg shadow-lg"
              >
                Browse All Products
                <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
              </a>
              <a
                href="/contact"
                className="group inline-flex items-center justify-center bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-all duration-300 text-lg"
              >
                Contact Support
                <span className="ml-3 group-hover:translate-x-2 transition-transform duration-300">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;