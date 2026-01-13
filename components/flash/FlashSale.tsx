// components/flash/FlashSale.tsx - UPDATED WITH YOUR BRANDING
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Tag, Clock, ChevronRight, Star, Truck, Leaf } from 'lucide-react';
import Image from 'next/image';

interface FlashSaleItem {
  id: number;
  name: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  category: string;
  rating: number;
  sold: number;
  stock: number;
  description: string;
}

interface FlashSaleProps {
  isPreview?: boolean;
}

export default function FlashSale({ isPreview = false }: FlashSaleProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 30,
    seconds: 45,
  });

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newSeconds = prev.seconds - 1;
        const newMinutes = newSeconds < 0 ? prev.minutes - 1 : prev.minutes;
        const newHours = newMinutes < 0 ? prev.hours - 1 : prev.hours;
        
        return {
          hours: newHours < 0 ? 23 : newHours,
          minutes: newMinutes < 0 ? 59 : newMinutes,
          seconds: newSeconds < 0 ? 59 : newSeconds,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const flashSaleItems: FlashSaleItem[] = [
    {
      id: 1,
      name: 'Fresh Organic Tomatoes (1kg)',
      originalPrice: 450,
      salePrice: 299,
      discount: 34,
      category: 'Vegetables',
      rating: 4.8,
      sold: 124,
      stock: 50,
      description: 'Farm-fresh organic tomatoes, perfect for salads and cooking',
    },
    {
      id: 2,
      name: 'Premium Hass Avocados (4pcs)',
      originalPrice: 300,
      salePrice: 199,
      discount: 34,
      category: 'Fruits',
      rating: 4.9,
      sold: 89,
      stock: 30,
      description: 'Creamy and delicious, perfect for guacamole',
    },
    {
      id: 3,
      name: 'Organic Carrots (1kg)',
      originalPrice: 280,
      salePrice: 189,
      discount: 32,
      category: 'Vegetables',
      rating: 4.7,
      sold: 156,
      stock: 45,
      description: 'Sweet and crunchy, packed with vitamins',
    },
    {
      id: 4,
      name: 'Fresh Milk (1L)',
      originalPrice: 180,
      salePrice: 149,
      discount: 17,
      category: 'Dairy',
      rating: 4.6,
      sold: 203,
      stock: 60,
      description: 'Pure, pasteurized fresh milk',
    },
    {
      id: 5,
      name: 'Organic Spinach (500g)',
      originalPrice: 220,
      salePrice: 149,
      discount: 32,
      category: 'Vegetables',
      rating: 4.5,
      sold: 98,
      stock: 40,
      description: 'Nutrient-rich fresh spinach leaves',
    },
    {
      id: 6,
      name: 'Bananas (1kg)',
      originalPrice: 150,
      salePrice: 99,
      discount: 34,
      category: 'Fruits',
      rating: 4.8,
      sold: 167,
      stock: 55,
      description: 'Sweet and ripe, perfect for snacks',
    },
    {
      id: 7,
      name: 'Free Range Eggs (12pcs)',
      originalPrice: 350,
      salePrice: 249,
      discount: 29,
      category: 'Poultry',
      rating: 4.7,
      sold: 134,
      stock: 35,
      description: 'Farm fresh free-range eggs',
    },
    {
      id: 8,
      name: 'Onions (1kg)',
      originalPrice: 180,
      salePrice: 129,
      discount: 28,
      category: 'Vegetables',
      rating: 4.6,
      sold: 187,
      stock: 65,
      description: 'Fresh red onions for your recipes',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <div className={`${isPreview ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-white'} rounded-3xl shadow-xl p-6 border border-amber-200`}>
      {/* Header with Branding */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <div className="relative">
            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-3 rounded-xl">
              <Tag className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
              <Leaf className="w-3 h-3 inline mr-1" />
              Organic
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Lando Flash Sale</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                🔥 HOT DEALS
              </span>
            </div>
            <p className="text-gray-600">Limited time offers! Don't miss out</p>
          </div>
        </div>
        
        {/* Timer with Brand Colors */}
        <div className="flex items-center gap-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg">
          <Clock className="w-5 h-5" />
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span>:</span>
            <span className="text-2xl font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span>:</span>
            <span className="text-2xl font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          </div>
          <span className="text-sm font-medium">LEFT</span>
        </div>
      </div>

      {/* Sale Items Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`grid ${isPreview ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-6`}
      >
        {flashSaleItems.slice(0, isPreview ? 4 : 8).map((item) => (
          <motion.div
            key={item.id}
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 group"
          >
            {/* Badge with Brand Colors */}
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                -{item.discount}% OFF
              </div>
            </div>
            
            {/* Product Image Placeholder with Brand Colors */}
            <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-green-200 to-emerald-300 flex items-center justify-center shadow-inner">
                <ShoppingBag className="w-16 h-16 text-green-600" />
              </div>
              {/* Category Badge */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700">
                {item.category}
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-5">
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-green-700 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{item.rating}</span>
                  </div>
                </div>
              </div>
              
              {/* Pricing */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">Ksh {item.salePrice}</span>
                    <span className="text-gray-400 line-through">Ksh {item.originalPrice}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Save Ksh {item.originalPrice - item.salePrice}
                    </span>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all hover:scale-110 shadow-md group-hover:shadow-lg">
                  <ShoppingBag className="w-5 h-5" />
                </button>
              </div>
              
              {/* Stock Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sold: {item.sold}</span>
                  <span className="text-gray-600">Stock: {item.stock}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(item.sold / (item.sold + item.stock)) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  ⚡ Hurry! Only {item.stock} left in stock
                </p>
              </div>
              
              {/* Delivery Info */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Free delivery in Nairobi</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* CTA Button */}
      {isPreview ? (
        <div className="text-center mt-8">
          <button className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-8 py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all hover:scale-105 shadow-lg">
            <ShoppingBag className="w-5 h-5" />
            View All Flash Deals 
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Available on Website
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Available on Mobile App
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row justify-between items-center mt-8 pt-8 border-t border-amber-200 gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-3 rounded-full">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Free Nairobi Delivery</p>
              <p className="text-sm text-gray-600">On orders above Ksh 2,000</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2">
              <Leaf className="w-5 h-5" />
              View Organic Collection
            </button>
            
            <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-8 py-3 rounded-full font-bold hover:shadow-xl transition-all hover:scale-105 flex items-center gap-2">
              Shop All Deals 
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}