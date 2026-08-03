'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { ChevronRight } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getCategoryIcon = () => {
    const name = category.name.toLowerCase();
    if (name.includes('fruit')) return '🍎';
    if (name.includes('vegetable')) return '🥦';
    if (name.includes('dairy') || name.includes('milk')) return '🥛';
    if (name.includes('meat') || name.includes('animal')) return '🥩';
    if (name.includes('fish') || name.includes('seafood')) return '🐟';
    if (name.includes('nut') || name.includes('seed')) return '🥜';
    if (name.includes('grain') || name.includes('flour')) return '🌾';
    if (name.includes('herb') || name.includes('spice')) return '🌿';
    if (name.includes('beverage') || name.includes('drink')) return '🧃';
    if (name.includes('flower')) return '💐';
    if (name.includes('handicraft')) return '🛠️';
    if (name.includes('root')) return '🥔';
    if (name.includes('leafy') || name.includes('green')) return '🥬';
    if (name.includes('tropical')) return '🍍';
    if (name.includes('legume') || name.includes('bean')) return '🫘';
    if (name.includes('poultry')) return '🍗';
    return '🛒';
  };

  const getCategoryColor = () => {
    const name = category.name.toLowerCase();
    if (name.includes('fruit')) return 'from-orange-400 to-orange-500';
    if (name.includes('vegetable')) return 'from-green-500 to-emerald-600';
    if (name.includes('dairy')) return 'from-blue-200 to-blue-300';
    if (name.includes('meat') || name.includes('animal')) return 'from-red-400 to-rose-500';
    if (name.includes('fish') || name.includes('seafood')) return 'from-blue-400 to-cyan-500';
    if (name.includes('nut') || name.includes('seed')) return 'from-amber-400 to-yellow-500';
    if (name.includes('grain') || name.includes('flour')) return 'from-amber-200 to-amber-400';
    if (name.includes('herb') || name.includes('spice')) return 'from-lime-400 to-green-500';
    if (name.includes('beverage')) return 'from-purple-400 to-indigo-500';
    return 'from-[#004E9A]/20 to-[#004E9A]/40';
  };

  const getImageUrl = (): string | null => {
    if (category.image) {
      let clean = category.image.trim();
      if (clean.startsWith('/')) clean = clean.substring(1);
      if (clean.startsWith('storage/')) clean = clean.substring('storage/'.length);
      if (clean.startsWith('categories/')) clean = clean.substring('categories/'.length);
      return `https://api.hypermarket.co.ke/storage/categories/${clean}`;
    }
    if (category.image_url) {
      return category.image_url
        .trim()
        .replace('https://hypermarket.co.ke', 'https://api.hypermarket.co.ke')
        .replace('http://hypermarket.co.ke', 'https://api.hypermarket.co.ke')
        .replace('hypermarket.co.ke', 'api.hypermarket.co.ke');
    }
    return null;
  };

  const imageUrl = getImageUrl();
  const icon = getCategoryIcon();
  const gradient = getCategoryColor();

  return (
    <Link
      href={`/categories/${category.slug || category.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-[#004E9A]/30 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
        style={{ height: '220px' }}
      >
        {/* Image area — fixed height, same on every card */}
        <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '148px' }}>

          {/* Fallback gradient + emoji */}
          <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${gradient}`}>
            <span className="text-5xl select-none">{icon}</span>
          </div>

          {/* Real image */}
          {imageUrl && !imageError && (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 z-10" />
              )}
              <img
                src={imageUrl}
                alt={category.name}
                className={`absolute inset-0 w-full h-full object-cover z-20 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                } ${isHovered ? 'scale-105' : 'scale-100'}`}
                style={{ transition: 'opacity 0.4s ease, transform 0.5s ease' }}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          )}

          {/* Bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-30 pointer-events-none" />
        </div>

        {/* Text area */}
        <div className="flex items-center justify-between px-3 flex-1 min-h-0">
          <h3
            className="flex-1 font-semibold text-gray-900 group-hover:text-[#004E9A] transition-colors duration-200 leading-tight pr-2"
            style={{
              fontSize: '0.82rem',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {category.name}
          </h3>

          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
              isHovered ? 'bg-[#004E9A] text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;