'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Category } from '@/types';
import { ChevronRight, Star, ShoppingBag, Sparkles } from 'lucide-react';

interface CategoryCardProps {
  category: Category;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get category icon based on name
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

  // Get category color based on type
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

  // FIXED: Correct image URL resolver
  const getImageUrl = (): string | null => {
    // If image_url exists, use it (clean up any whitespace)
    if (category.image_url) {
      let url = category.image_url.trim();
      
      // Remove any leading space before https
      if (url.startsWith(' https://')) {
        url = url.substring(1); // Remove the space
      }
      
      // Ensure it's a valid URL
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      return url;
    }
    
    // If image field exists, construct URL
    if (category.image) {
      let cleanImage = category.image.trim();
      
      // Remove leading slash if present
      if (cleanImage.startsWith('/')) {
        cleanImage = cleanImage.substring(1);
      }
      
      // Remove 'storage/' if already in path
      if (cleanImage.startsWith('storage/')) {
        cleanImage = cleanImage.substring('storage/'.length);
      }
      
      // Construct the full URL
      return `https://api.hypermarket.co.ke/storage/${cleanImage}`;
    }
    
    return null; // No image, we'll use gradient
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
      {/* Animated background glow */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl`} />
      
      {/* Main card */}
      <div className="relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {imageUrl ? (
            <>
              {/* Loading shimmer */}
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
              )}
              
              {/* Main image */}
              <img
                src={imageUrl}
                alt={category.name}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isHovered ? 'scale-110' : 'scale-100'
                } ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  console.error('Category image failed to load:', imageUrl);
                  // Fallback to gradient if image fails
                  e.currentTarget.style.display = 'none';
                }}
              />
            </>
          ) : (
            // Gradient fallback with icon
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}>
              <span className="text-6xl">{icon}</span>
            </div>
          )}
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          
          {/* Product count badge */}
          {productCount > 0 && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full shadow-sm">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <ShoppingBag size={14} />
                <span>{productCount}</span>
              </div>
            </div>
          )}
          
          {/* Featured badge for certain categories */}
          {productCount > 20 && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Star size={12} className="fill-white" />
                <span>Popular</span>
              </div>
            </div>
          )}
          
          {/* Hover indicator */}
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span>Browse Now</span>
              <ChevronRight size={16} className={`transition-transform duration-300 ${
                isHovered ? 'translate-x-1' : ''
              }`} />
            </div>
          </div>
          
          {/* Sparkle effect on hover */}
          {isHovered && (
            <>
              <div className="absolute top-1/4 left-1/4 animate-ping w-2 h-2 bg-yellow-400 rounded-full" />
              <div className="absolute top-1/3 right-1/4 animate-ping w-1.5 h-1.5 bg-green-400 rounded-full delay-150" />
              <div className="absolute bottom-1/4 right-1/3 animate-ping w-1 h-1 bg-blue-400 rounded-full delay-300" />
            </>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300 line-clamp-1">
                {category.name}
              </h3>
              
              {category.description && (
                <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>
            
            {/* Animated arrow */}
            <div className="relative">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center transition-all duration-300 ${
                isHovered ? 'scale-110 rotate-12' : ''
              }`}>
                <ChevronRight size={20} className="text-green-600" />
              </div>
              
              {/* Ring animation on hover */}
              {isHovered && (
                <div className="absolute inset-0 border-2 border-green-300 rounded-full animate-ping" />
              )}
            </div>
          </div>
          
          {/* Bottom info */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-lg">{icon}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {productCount > 0 ? `${productCount} items` : 'Coming soon'}
              </span>
            </div>
            
            {/* Quick stats */}
            {productCount > 0 && (
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs text-amber-600 font-semibold">
                  {productCount > 50 ? 'Premium' : productCount > 20 ? 'Popular' : 'Fresh'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Floating particles on hover */}
      {isHovered && (
        <>
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-400 rounded-full opacity-50 animate-bounce" />
          <div className="absolute -bottom-2 -right-2 w-3 h-3 bg-orange-400 rounded-full opacity-50 animate-bounce delay-100" />
          <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400 rounded-full opacity-50 animate-bounce delay-200" />
        </>
      )}
    </Link>
  );
};

export default CategoryCard;