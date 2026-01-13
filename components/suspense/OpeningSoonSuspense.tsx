// components/suspense/OpeningSoonSuspense.tsx - UPDATED WITH YOUR LOGO
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, Mail, Phone, MapPin, ShoppingBag, Star, Truck, Leaf } from 'lucide-react';
import CountdownTimer from './CountdownTimer';
import FlashSale from '../flash/FlashSale';
import Image from 'next/image';

export default function OpeningSoonSuspense() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem('opening-soon-full-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      setHasDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('opening-soon-full-dismissed', 'true');
    setHasDismissed(true);
  };

  const handleEarlyAccess = () => {
    const emailInput = document.getElementById('early-access-email');
    if (emailInput) {
      emailInput.focus();
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-green-50 via-white to-emerald-50"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-green-500/[0.02] bg-[size:20px_20px]" />
          
          {/* Main Content */}
          <div className="relative min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-6 right-6 md:top-8 md:right-8 p-3 rounded-full bg-white/80 hover:bg-white shadow-lg transition-all hover:scale-110 z-50"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>

            {/* Logo and Brand Section */}
            <div className="text-center mb-8 md:mb-12">
              <div className="flex flex-col items-center justify-center">
                {/* Your Actual Logo */}
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center shadow-2xl mb-6 border-4 border-green-100 overflow-hidden">
                  <Image
                    src="/logo.jpeg"
                    alt="Lando Hypermarket Logo"
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
                
                {/* Brand Name */}
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-2">
                  <span className="text-green-600">LANDO</span>{' '}
                  <span className="text-emerald-700">HYPERMARKET</span>
                </h1>
                
                {/* Slogan */}
                <p className="text-lg md:text-2xl text-gray-600 italic max-w-2xl">
                  "Famous And Renowned Throughout The Land In Organic Manner"
                </p>
                
                {/* Tagline */}
                <div className="flex items-center gap-2 mt-4">
                  <Leaf className="w-5 h-5 text-green-500" />
                  <p className="text-gray-500 text-sm md:text-base">
                    Bringing fresh, organic produce to your neighborhood
                  </p>
                </div>
              </div>
            </div>

            {/* Opening Soon Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 max-w-4xl w-full border border-green-100"
            >
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                {/* Left Side - Opening Message */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full mb-6">
                    <Timer className="w-5 h-5" />
                    <span className="font-semibold">COMING SOON</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Opening Soon At{' '}
                    <span className="text-green-600 underline">Your Neighbourhood!</span>
                  </h2>
                  
                  <p className="text-gray-600 text-lg mb-6">
                    We're preparing something amazing for you! Get ready for the ultimate 
                    grocery shopping experience with fresh, organic produce delivered 
                    straight to your doorstep.
                  </p>
                  
                  {/* Features Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { icon: Star, text: '100% Organic', color: 'text-yellow-500' },
                      { icon: Truck, text: 'Free Delivery', color: 'text-green-500' },
                      { icon: Timer, text: 'Same Day', color: 'text-blue-500' },
                      { icon: ShoppingBag, text: 'Fresh Stock', color: 'text-emerald-500' },
                    ].map((feature, index) => (
                      <div key={index} className="flex flex-col items-center p-3 bg-green-50 rounded-xl">
                        <feature.icon className={`w-6 h-6 ${feature.color} mb-2`} />
                        <span className="text-sm font-medium text-gray-700">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Right Side - Countdown & Signup */}
                <div className="flex-1 max-w-md">
                  <CountdownTimer targetDate={new Date('2024-02-01T00:00:00')} />
                  
                  {/* Early Access Form */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white mt-8">
                    <h3 className="text-xl font-bold mb-3">Get Early Access!</h3>
                    <p className="text-green-100 mb-4">
                      Be the first to shop when we launch. Get exclusive offers and updates.
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        id="early-access-email"
                        type="email"
                        placeholder="Enter your email address"
                        className="w-full px-4 py-3 rounded-lg bg-white/20 placeholder-green-200 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                      <button
                        onClick={handleEarlyAccess}
                        className="w-full bg-white text-green-700 font-bold py-3 rounded-lg hover:bg-green-50 transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        Notify Me on Launch
                      </button>
                    </div>
                    
                    <p className="text-xs text-green-200 mt-3">
                      We'll never spam you. Unsubscribe anytime.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Flash Sale Preview Section */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 max-w-6xl w-full"
            >
              <FlashSale isPreview={true} />
            </motion.div>

            {/* Contact Info */}
            <div className="mt-12 flex flex-wrap justify-center gap-6 md:gap-10 text-gray-600">
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-green-600" />
                <span>+254 716 354 589</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-green-600" />
                <span>info@hypermarket.co.ke</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>

            {/* Partner CTA */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-10 text-center"
            >
              <button
                onClick={() => {
                  const contactSection = document.getElementById('contact');
                  if (contactSection) {
                    contactSection.scrollIntoView({ behavior: 'smooth' });
                    setIsVisible(false);
                  }
                }}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                🤝 Partner With Us For Exclusive Deals →
              </button>
              <p className="text-gray-500 mt-3 text-sm">
                Local farmers, suppliers, and businesses welcome
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}