// components/suspense/OpeningSoonSuspense.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function OpeningSoonSuspense() {
  const [isVisible, setIsVisible] = useState(true);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the message before
    const dismissed = localStorage.getItem('opening-soon-dismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
      setHasDismissed(true);
    }

    // Auto-hide after 10 seconds if not dismissed
    const timer = setTimeout(() => {
      if (!hasDismissed) {
        setIsVisible(false);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [hasDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('opening-soon-dismissed', 'true');
    setHasDismissed(true);
  };

  const handleCTAClick = () => {
    // Scroll to partnership/contact section
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute -inset-1 animate-ping bg-white/20 rounded-full"></div>
                      <div className="relative bg-white text-green-600 rounded-full p-1">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                    </div>
                    <span className="font-bold text-lg sm:text-xl tracking-wide">
                      OPENING SOON AT YOUR NEIGHBOURHOOD!
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline text-green-100">
                      ⚡ Be the first to experience fresh produce delivery
                    </span>
                    <button
                      onClick={handleCTAClick}
                      className="px-4 py-1.5 bg-white text-green-700 font-semibold rounded-full hover:bg-green-50 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base shadow-md"
                    >
                      Partner With Us →
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Countdown timer */}
          <div className="h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 10, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}