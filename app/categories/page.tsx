'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Category } from '@/types';
import CategoryCard from '@/components/ui/CategoryCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Search, Grid2x2, List, ShoppingBag, ChevronRight, ArrowRight } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filtered, setFiltered] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await api.categories.getAll();
        // Only main categories (no sub-categories)
        const main: Category[] = (response.data || []).filter(
          (c: Category) => c.is_active !== false && !c.parent_id
        );
        setCategories(main);
        setFiltered(main);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let result = [...categories];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => a.name.localeCompare(b.name));
    setFiltered(result);
  }, [categories, searchQuery]);

  const getImageUrl = (category: Category): string | null => {
    if (category.image) {
      let clean = category.image.trim().replace(/^\//, '').replace(/^storage\//, '').replace(/^categories\//, '');
      return `https://api.hypermarket.co.ke/storage/categories/${clean}`;
    }
    if (category.image_url) {
      return category.image_url
        .replace('https://hypermarket.co.ke', 'https://api.hypermarket.co.ke')
        .replace('http://hypermarket.co.ke', 'https://api.hypermarket.co.ke');
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <section className="relative bg-[#004E9A] overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-white/5" />
        <div className="relative mx-auto px-4 sm:px-6 lg:px-12 py-12 md:py-16">
          <p className="text-blue-200 text-sm font-semibold uppercase tracking-widest mb-2">Browse our store</p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4">Shop by Category</h1>
          <p className="text-blue-100 text-base md:text-lg mb-8 max-w-xl">
            Find exactly what you need across our wide range of fresh produce and products.
          </p>
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-lg text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Controls ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 py-3 flex items-center justify-between gap-4">
          <span className="text-sm text-gray-500">
            <span className="font-bold text-gray-800">{filtered.length}</span> categories
          </span>
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#004E9A] shadow' : 'text-gray-400 hover:text-gray-600'}`}
              title="Grid view"
            >
              <Grid2x2 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#004E9A] shadow' : 'text-gray-400 hover:text-gray-600'}`}
              title="List view"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto px-4 sm:px-6 lg:px-12 py-8 max-w-[1400px]">
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Search size={36} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No categories found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? `Nothing matched "${searchQuery}"` : 'No categories available right now.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="bg-[#004E9A] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#003E8A] transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((category) => {
              const imgSrc = getImageUrl(category);
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug || category.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#004E9A] hover:shadow-md transition-all duration-200 group"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#004E9A]/10 to-[#004E9A]/20">
                        <ShoppingBag size={22} className="text-[#004E9A]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#004E9A] transition-colors truncate">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">{category.description}</p>
                    )}
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-[#004E9A] group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      <section className="bg-white border-t border-gray-100 py-12 mt-8">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 text-center max-w-xl">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Can't find what you need?</h2>
          <p className="text-gray-500 text-sm mb-6">Browse our full product catalog or get in touch with us.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 bg-[#004E9A] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#003E8A] transition-colors shadow-md group"
            >
              Browse All Products
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/support"
              className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CategoriesPage;