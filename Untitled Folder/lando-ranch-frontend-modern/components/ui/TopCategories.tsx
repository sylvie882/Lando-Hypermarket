'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface CategoryData {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent_id?: number;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
}

interface TopCategoriesProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

// Naivas/Carrefour-style "shop by category" palette — each tile gets its own
// bright flat background so the grid reads as colourful, not monochrome.
const PALETTE: { bg: string; text: string; icon: string }[] = [
  { bg: '#FFF3E0', text: '#C2410C', icon: '🍎' }, // fruit / orange
  { bg: '#E8F5E9', text: '#166534', icon: '🥦' }, // veg / green
  { bg: '#E3F2FD', text: '#004E9A', icon: '🥛' }, // dairy / blue
  { bg: '#FDE8E8', text: '#B8000A', icon: '🥩' }, // meat / red
  { bg: '#E0F7FA', text: '#0E7490', icon: '🐟' }, // fish / cyan
  { bg: '#FFF8E1', text: '#A16207', icon: '🌾' }, // grains / amber
  { bg: '#F3E8FF', text: '#7E22CE', icon: '🧃' }, // beverages / purple
  { bg: '#FCE7F3', text: '#BE185D', icon: '🧴' }, // household / pink
  { bg: '#ECFCCB', text: '#4D7C0F', icon: '🥬' }, // leafy greens / lime
  { bg: '#FFEDD5', text: '#9A3412', icon: '🍗' }, // poultry / peach
  { bg: '#E0E7FF', text: '#3730A3', icon: '🛠️' }, // handicrafts / indigo
  { bg: '#F0FDFA', text: '#0F766E', icon: '🌿' }, // herbs / teal
];

const getPaletteFor = (name: string, index: number) => {
  const lower = name.toLowerCase();
  if (lower.includes('fruit')) return PALETTE[0];
  if (lower.includes('vegetable') || lower.includes('root')) return PALETTE[1];
  if (lower.includes('dairy') || lower.includes('milk')) return PALETTE[2];
  if (lower.includes('meat') || lower.includes('animal')) return PALETTE[3];
  if (lower.includes('fish') || lower.includes('seafood')) return PALETTE[4];
  if (lower.includes('grain') || lower.includes('flour') || lower.includes('nut')) return PALETTE[5];
  if (lower.includes('beverage') || lower.includes('drink')) return PALETTE[6];
  if (lower.includes('clean') || lower.includes('household')) return PALETTE[7];
  if (lower.includes('leafy') || lower.includes('green')) return PALETTE[8];
  if (lower.includes('poultry')) return PALETTE[9];
  if (lower.includes('handicraft') || lower.includes('wooden')) return PALETTE[10];
  if (lower.includes('herb') || lower.includes('spice')) return PALETTE[11];
  return PALETTE[index % PALETTE.length];
};

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  let cleanPath = path;
  if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
  if (cleanPath.startsWith('storage/')) cleanPath = cleanPath.replace('storage/', '');
  return `https://api.hypermarket.co.ke/storage/${cleanPath}`;
};

const TopCategories: React.FC<TopCategoriesProps> = ({
  limit = 12,
  showHeader = true,
  className = '',
}) => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const categoriesRes = await api.categories.getAll();
        const allCategories = categoriesRes.data || [];
        const activeCategories = allCategories
          .filter((cat: CategoryData) => cat.is_active)
          .slice(0, limit);
        setCategories(activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [limit]);

  if (isLoading) {
    return (
      <section className={`compact-section bg-white ${className}`}>
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="animate-pulse">
            {showHeader && <div className="h-8 w-56 bg-gray-200 rounded mb-6" />}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className={`compact-section bg-white ${className}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
        {showHeader && (
          <div className="flex items-end justify-between mb-5 md:mb-6">
            <div className="flex items-center gap-2.5">
              <span className="section-accent-bar" />
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Shop by Category</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-0.5">Everything you need, all in one place</p>
              </div>
            </div>
            <Link
              href="/categories"
              className="hidden sm:inline-flex text-sm font-semibold text-[#004E9A] hover:text-[#003875] transition-colors whitespace-nowrap"
            >
              View all →
            </Link>
          </div>
        )}

        {/* Mobile: horizontal snap scroll. Desktop: full grid, everything visible, no arrows needed. */}
        <div className="flex md:grid md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory -mx-1 px-1">
          {categories.map((category, index) => {
            const palette = getPaletteFor(category.name, index);
            const imgUrl = getImageUrl(category.image);
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="category-card group flex-shrink-0 md:flex-shrink w-[84px] md:w-full snap-start flex flex-col items-center text-center"
              >
                <div
                  className="w-16 h-16 md:w-[72px] md:h-[72px] rounded-2xl flex items-center justify-center overflow-hidden mb-2 ring-1 ring-black/5 group-hover:ring-2 transition-all duration-300"
                  style={{ background: palette.bg, ['--tw-ring-color' as any]: palette.text }}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-3xl select-none">{palette.icon}</span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 text-[11px] md:text-xs leading-tight line-clamp-2 group-hover:text-[#004E9A] transition-colors">
                  {category.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TopCategories;
