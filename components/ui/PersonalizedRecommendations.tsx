'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import Link from 'next/link';
import { ArrowRight, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface PersonalizedRecommendationsProps {
  title?: string;
  limit?: number;
  showHeader?: boolean;
  showStrategy?: boolean;
  className?: string;
}

// Extend Product type to include metadata
interface ProductWithMetadata extends Product {
  metadata?: {
    relevance_score?: number;
    recommendation_type?: string;
  };
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  title = "Recommended For You",
  limit = 12,
  showHeader = true,
  showStrategy = false,
  className = ""
}) => {
  const [recommendations, setRecommendations] = useState<ProductWithMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strategyUsed, setStrategyUsed] = useState<string>('hybrid');
  const [totalRecommendations, setTotalRecommendations] = useState(0);

  const fetchRecommendations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching recommendations with limit:', limit);
      
      // API call returns the data directly now
      const response = await api.products.getPersonalizedRecommendations({
        limit,
        strategy: 'hybrid'
      });
      
      console.log('API response received:', response);
      
      if (response.success && Array.isArray(response.recommendations)) {
        // Transform the API response to match Product type
        const transformedProducts: ProductWithMetadata[] = response.recommendations.map((rec: any) => {
          // Calculate final price
          const finalPrice = rec.discounted_price || rec.price;
          
          // Clean up image paths - handle escaped forward slashes
          let thumbnail = rec.thumbnail || '';
          let main_image = rec.main_image || rec.thumbnail || '';
          
          // The JSON has escaped forward slashes, but JavaScript parses them correctly
          // However, let's ensure they're clean
          if (thumbnail.includes('\\/')) {
            thumbnail = thumbnail.replace(/\\\//g, '/');
          }
          if (main_image.includes('\\/')) {
            main_image = main_image.replace(/\\\//g, '/');
          }
          
          // Remove leading slashes if present
          if (thumbnail.startsWith('/')) {
            thumbnail = thumbnail.substring(1);
          }
          if (main_image.startsWith('/')) {
            main_image = main_image.substring(1);
          }
          
          console.log(`Product ${rec.id}:`, {
            rawThumbnail: rec.thumbnail,
            cleanedThumbnail: thumbnail,
            expectedUrl: `https://api.hypermarket.co.ke/storage/${thumbnail}`
          });
          
          return {
            id: rec.id,
            name: rec.name,
            slug: rec.slug,
            description: rec.description || '',
            price: rec.price,
            discounted_price: rec.discounted_price,
            final_price: finalPrice,
            thumbnail: thumbnail,
            main_image: main_image,
            category: rec.category ? {
              id: rec.category.id,
              name: rec.category.name,
              slug: rec.category.slug,
              description: rec.category.description || '',
              image: rec.category.image || '',
              is_active: true,
              order: 0,
              created_at: rec.category.created_at || new Date().toISOString(),
              updated_at: rec.category.updated_at || new Date().toISOString()
            } : null,
            vendor: rec.vendor ? {
              id: rec.vendor.id,
              name: rec.vendor.name,
              email: rec.vendor.email || '',
              phone: rec.vendor.phone || '',
              is_active: true,
              created_at: rec.vendor.created_at || new Date().toISOString(),
              updated_at: rec.vendor.updated_at || new Date().toISOString()
            } : null,
            rating: rec.rating || 0,
            review_count: rec.review_count || 0,
            stock_quantity: rec.stock_quantity || 0,
            is_in_stock: (rec.stock_quantity || 0) > 0,
            is_active: rec.is_active !== undefined ? rec.is_active : true,
            is_featured: rec.is_featured || false,
            views: rec.views || 0,
            sold_count: rec.sold_count || 0,
            created_at: rec.created_at,
            updated_at: rec.updated_at || rec.created_at,
            images: [],
            // Additional metadata from recommendations
            metadata: {
              relevance_score: rec.relevance_score || 0,
              recommendation_type: rec.recommendation_type || 'popular'
            }
          };
        });
        
        console.log('Transformed products count:', transformedProducts.length);
        console.log('Sample transformed product:', transformedProducts[0]);
        
        setRecommendations(transformedProducts);
        setStrategyUsed(response.strategy_used || 'hybrid');
        setTotalRecommendations(response.total || 0);
      } else {
        console.error('Invalid response structure:', response);
        setError(response.message || 'Failed to load recommendations');
      }
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      console.error('Error details:', err.response?.data || err.message);
      setError(`Failed to load personalized recommendations: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const trackProductView = async (productId: number) => {
    try {
      await api.products.trackView(productId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  };

  const refreshRecommendations = () => {
    fetchRecommendations();
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Add a fallback for non-authenticated users
  if (isLoading) {
    return (
      <div className={`py-8 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-yellow-500 animate-pulse" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
          </div>
        )}
        <div className="product-grid grid">
          {Array.from({ length: Math.min(limit, 12) }).map((_, index) => (
            <div 
              key={index} 
              className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden scroll-hover"
              style={{
                animationDelay: `${index * 50}ms`
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
    );
  }

  if (error && recommendations.length === 0) {
    return (
      <div className={`py-8 ${className}`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-yellow-500" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            </div>
            <button
              onClick={refreshRecommendations}
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              <RefreshCw size={16} className="mr-1" />
              Refresh
            </button>
          </div>
        )}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-yellow-500 mb-3" size={48} />
          <p className="text-yellow-800 mb-4">{error}</p>
          <button
            onClick={refreshRecommendations}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`py-8 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshRecommendations}
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              <RefreshCw size={16} className="mr-1" />
              Refresh
            </button>
            <Link 
              href="/recommendations" 
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      )}

      {recommendations.length > 0 ? (
        <>
          {/* UPDATED: 6 cards per row on desktop, 1 on mobile - Same as homepage */}
          <div className="product-grid grid">
            {recommendations.map((product, index) => (
              <div 
                key={product.id} 
                className="scroll-hover bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 relative"
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Recommendation type badge */}
                {product.metadata?.recommendation_type && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      product.metadata.recommendation_type === 'preference_based' 
                        ? 'bg-blue-100 text-blue-800'
                        : product.metadata.recommendation_type === 'purchase_based'
                        ? 'bg-green-100 text-green-800'
                        : product.metadata.recommendation_type === 'view_based'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {product.metadata.recommendation_type.replace('_', ' ')}
                    </span>
                  </div>
                )}
                
                {/* Relevance score indicator */}
                {product.metadata?.relevance_score && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                      <Sparkles size={12} className="text-yellow-500" />
                      <span className="text-xs font-bold">
                        {Math.round(product.metadata.relevance_score)}%
                      </span>
                    </div>
                  </div>
                )}
                
                <ProductCard 
                  product={product} 
                  onViewTrack={trackProductView}
                />
              </div>
            ))}
          </div>
          
          {recommendations.length < limit && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {recommendations.length} personalized recommendations
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recommendations yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start browsing products and making purchases to get personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              Browse Products
              <ArrowRight size={18} className="ml-2" />
            </Link>
            <Link
              href="/categories"
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              Explore Categories
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;