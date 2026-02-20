'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import Link from 'next/link';
import { Clock4, ArrowRight } from 'lucide-react';

interface NewArrivalsProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
}

const NewArrivals: React.FC<NewArrivalsProps> = ({
  limit = 12,
  showHeader = true,
  className = '',
  compact = true,
  title = "New Arrivals"
}) => {
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  const fetchNewArrivals = async () => {
    try {
      setIsLoading(true);
      
      // Fetch new arrivals
      const newArrivalsRes = await api.products.getAll({ 
        per_page: limit, 
        sort: 'created_at', 
        order: 'desc' 
      });
      
      let newArrivalsData = newArrivalsRes.data?.data || newArrivalsRes.data || [];
      
      // Ensure exactly the limit of new arrivals
      if (newArrivalsData.length > limit) {
        newArrivalsData = newArrivalsData.slice(0, limit);
      }
      
      setNewArrivals(newArrivalsData);

    } catch (error) {
      console.error('Failed to fetch new arrivals:', error);
      setNewArrivals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={`${compact ? 'compact-section' : 'py-8'} bg-white px-4 sm:px-6 md:px-8 lg:px-12 ${className}`}>
        <div className="w-full">
          <div className="animate-pulse">
            {showHeader && (
              <div className="flex items-center justify-between mb-6">
                <div className="h-8 w-48 bg-gray-200 rounded"></div>
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </div>
            )}
            <div className="product-grid grid gap-4">
              {[...Array(Math.min(limit, 12))].map((_, i) => (
                <div 
                  key={i} 
                  className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  style={{
                    animationDelay: `${i * 50}ms`
                  }}
                >
                  <div className="bg-gray-200 h-48"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (newArrivals.length === 0) {
    return null;
  }

  return (
    <section className={`${compact ? 'compact-section' : 'py-8'} bg-white px-4 sm:px-6 md:px-8 lg:px-12 ${className}`}>
      <div className="w-full">
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg">
                <Clock4 size={20} className="text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <Link 
              href="/products?new=true" 
              className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center text-sm"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
        )}
        
        <div className="product-grid grid">
          {newArrivals.map((product, index) => (
            <div 
              key={product.id} 
              className="scroll-hover bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-emerald-300 overflow-hidden transition-all duration-300"
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <ProductCard 
                product={product} 
                onViewTrack={trackProductView}
              />
            </div>
          ))}
        </div>
        
        {/* Show count */}
        {showHeader && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Showing {newArrivals.length} new arrivals
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (max-width: 639px) {
          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1023px) {
          .product-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
        
        @media (min-width: 1024px) {
          .product-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </section>
  );
};

export default NewArrivals;