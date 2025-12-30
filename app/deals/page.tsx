// app/deals/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types';
import { 
  Tag, 
  Percent, 
  Clock, 
  ArrowRight,
  Sparkles,
  Flame
} from 'lucide-react';
import Link from 'next/link';

// Format currency to KSH
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Create a simple API function for this page
const fetchDeals = async (): Promise<Product[]> => {
  try {
    const response = await fetch('https://api.hypermarket.co.ke/api/products?per_page=50');
    const data = await response.json();
    const products = data.data || data || [];
    
    // Filter products with discounts
    return products.filter((product: Product) => 
      product.discounted_price && 
      parseFloat(product.discounted_price.toString()) < parseFloat(product.price.toString())
    );
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    return [];
  }
};

// Simple Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
  </div>
);

// Simple Product Card Component
const ProductCard = ({ product }: { product: Product }) => {
  const price = parseFloat(product.price.toString());
  const discountedPrice = parseFloat(product.discounted_price?.toString() || price.toString());
  const discountPercentage = Math.round(((price - discountedPrice) / price) * 100);
  
  // Get image URL
  const getImageUrl = () => {
    if (!product.thumbnail) return '/images/placeholder-product.jpg';
    
    const cleanThumbnail = product.thumbnail.replace(/^\//, '');
    return `https://api.hypermarket.co.ke/storage/${cleanThumbnail}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Link href={`/products/${product.id}`}>
          <img
            src={getImageUrl()}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/images/placeholder-product.jpg';
            }}
          />
        </Link>
        
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discountPercentage}%
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-medium text-gray-800 hover:text-green-600 line-clamp-2 h-12 mb-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(discountedPrice)}
            </span>
            {discountPercentage > 0 && (
              <span className="text-sm text-gray-500 line-through ml-2">
                {formatCurrency(price)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button */}
        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium text-sm transition-colors">
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const DealsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDeals = async () => {
      setIsLoading(true);
      const deals = await fetchDeals();
      setProducts(deals);
      setIsLoading(false);
    };
    
    loadDeals();
  }, []);

  const calculateDiscountPercentage = (price: number, discountedPrice: number) => {
    return Math.round(((price - discountedPrice) / price) * 100);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const bestDeal = products.length > 0 
    ? products.reduce((best, current) => {
        const currentPrice = parseFloat(current.price.toString());
        const currentDiscounted = parseFloat(current.discounted_price?.toString() || '0');
        const currentDiscount = calculateDiscountPercentage(currentPrice, currentDiscounted);
        
        const bestPrice = parseFloat(best.price.toString());
        const bestDiscounted = parseFloat(best.discounted_price?.toString() || '0');
        const bestDiscount = calculateDiscountPercentage(bestPrice, bestDiscounted);
        
        return currentDiscount > bestDiscount ? current : best;
      })
    : null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-4">
                <Flame size={18} />
                <span className="text-sm font-semibold">Hot Deals</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                Today's Best <span className="text-yellow-300">Deals</span>
              </h1>
              
              <p className="text-lg text-white/95 max-w-2xl">
                Save big on farm-fresh products. Limited time offers updated daily.
              </p>
            </div>
            
            {bestDeal && (
              <div className="bg-white text-gray-900 rounded-xl p-6 shadow-xl max-w-md">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={20} className="text-red-500" />
                  <span className="font-semibold text-red-600">Deal of the Day</span>
                </div>
                
                <h3 className="font-bold text-lg mb-2 line-clamp-2">
                  {bestDeal.name}
                </h3>
                
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(parseFloat(bestDeal.discounted_price?.toString() || '0'))}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatCurrency(parseFloat(bestDeal.price.toString()))}
                  </span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    {calculateDiscountPercentage(
                      parseFloat(bestDeal.price.toString()),
                      parseFloat(bestDeal.discounted_price?.toString() || '0')
                    )}% OFF
                  </span>
                </div>
                
                <Link
                  href={`/products/${bestDeal.id}`}
                  className="inline-flex items-center justify-center w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  <span>Grab This Deal</span>
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                <Tag size={24} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                <Percent size={24} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Discount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.length > 0 
                    ? Math.round(products.reduce((sum, product) => {
                        const price = parseFloat(product.price.toString());
                        const discountedPrice = parseFloat(product.discounted_price?.toString() || '0');
                        return sum + calculateDiscountPercentage(price, discountedPrice);
                      }, 0) / products.length)
                    : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
                <Clock size={24} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Time Left</p>
                <p className="text-2xl font-bold text-gray-900">Today Only</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900">
              Browse All Deals
            </h2>
            <p className="text-gray-600 mt-1">
              {products.length} discounted products available
            </p>
          </div>

          {/* Products Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <Tag size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No deals available
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                There are no discounted products at the moment. Check back soon!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Browse All Products
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 rounded-lg font-medium border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Want to stay updated on deals?
            </h2>
            
            <p className="text-gray-600 mb-8">
              Follow us on social media for flash sales and exclusive discounts.
            </p>
            
            <div className="flex justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <span>Shop All Products</span>
                <ArrowRight size={18} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealsPage;