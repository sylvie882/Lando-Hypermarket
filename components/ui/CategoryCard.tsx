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
    if (name.includes('dairy')) return 'from-blue-100 to-blue-200';
    if (name.includes('meat') || name.includes('animal')) return 'from-red-400 to-rose-500';
    if (name.includes('fish') || name.includes('seafood')) return 'from-blue-400 to-cyan-500';
    if (name.includes('nut') || name.includes('seed')) return 'from-amber-500 to-yellow-500';
    if (name.includes('grain') || name.includes('flour')) return 'from-amber-200 to-amber-300';
    if (name.includes('herb') || name.includes('spice')) return 'from-lime-400 to-green-500';
    if (name.includes('beverage')) return 'from-purple-400 to-indigo-500';
    return 'from-gray-100 to-gray-200';
  };

  const getImageUrl = (): string | null => {
    if (category.image) {
      let cleanImage = category.image.trim();
      
      if (cleanImage.startsWith('/')) {
        cleanImage = cleanImage.substring(1);
      }
      
      if (cleanImage.startsWith('storage/')) {
        cleanImage = cleanImage.substring('storage/'.length);
      }
      
      if (cleanImage.startsWith('categories/')) {
        cleanImage = cleanImage.substring('categories/'.length);
      }
      
      return `https://api.hypermarket.co.ke/storage/categories/${cleanImage}`;
    }
    
    if (category.image_url) {
      let url = category.image_url.trim();
      url = url.replace('https://hypermarket.co.ke', 'https://api.hypermarket.co.ke');
      url = url.replace('http://hypermarket.co.ke', 'https://api.hypermarket.co.ke');
      url = url.replace('hypermarket.co.ke', 'api.hypermarket.co.ke');
      return url;
    }
    
    return null;
  };

  const imageUrl = getImageUrl();
  const productCount = category.active_products_count || category.products_count || 0;
  const icon = getCategoryIcon();
  const gradient = getCategoryColor();

  return (
    <Link
      href={`/categories/${category.slug || category.id}`}
      className="group relative block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {imageUrl && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
              )}
              
              <img
                src={imageUrl}
                alt={category.name}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isHovered ? 'scale-110' : 'scale-100'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
              <span className="text-6xl opacity-80">{icon}</span>
            </div>
          )}
          
          {/* Subtle overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          
          {/* Minimal product count */}
          {productCount > 0 && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-gray-700">
              {productCount} items
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                {category.name}
              </h3>
              
              {category.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
            
            {/* Simple arrow indicator */}
            <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'bg-green-100 translate-x-1' : ''
            }`}>
              <ChevronRight size={18} className="text-gray-600" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;