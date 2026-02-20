'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import BannerCarousel from '@/components/ui/BannerCarousel';
import TopCategories from '@/components/ui/TopCategories';
import FeaturedProducts from '@/components/ui/FeaturedProducts';
import WoodenUtensils from '@/components/ui/WoodenUtensils';
import CleaningSuppliesPage from '@/components/ui/CleaningSupplies';
import NewArrivals from '@/components/ui/NewArrivals';
import PersonalizedRecommendations from '@/components/ui/PersonalizedRecommendations';
import { 
  ArrowUp,
  HelpCircle,
  Phone,
  Gift,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import WoodenUtensilsPage from '@/components/ui/WoodenUtensils';
import CleaningSupplies from '@/components/ui/CleaningSupplies';

const HomePage: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  
  // Get authentication status from auth context
  const { isAuthenticated } = useAuth();

  // Refs
  const featuredSectionRef = useRef<HTMLDivElement>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);
  const newArrivalsSectionRef = useRef<HTMLDivElement>(null);

  // Colors - QuickMart style
  const colors = {
    primary: '#90EE90', // Light Green
    primaryDark: '#5CD65C', // Darker Green
    gold: '#FFD700', // Gold
    orange: '#FFA500', // Warm Orange
    secondary: '#333333',
    green: '#28a745',
    yellow: '#ffc107',
    lightGray: '#f8f9fa',
    dark: '#2c3e50'
  };

  const whatsappNumber = '+254716354589';
  const whatsappMessage = encodeURIComponent('Hello! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  // Scroll to top
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
      
      const sections = [
        featuredSectionRef.current,
        categoriesSectionRef.current,
        newArrivalsSectionRef.current
      ];
      
      sections.forEach(section => {
        if (section) {
          const rect = section.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight - 100;
          
          if (isVisible) {
            section.classList.add('animate-fade-up');
          }
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Custom scroll animation styles */}
      <style jsx global>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-up {
          animation: fadeUp 0.6s ease-out forwards;
        }
        
        .section-hidden {
          opacity: 0;
          transform: translateY(30px);
        }
        
        .scroll-hover {
          transition: transform 0.3s ease;
        }
        
        .scroll-hover:hover {
          transform: translateY(-5px);
        }
        
        .compact-section {
          padding-top: 1.5rem !important;
          padding-bottom: 1.5rem !important;
        }
        
        @media (min-width: 768px) {
          .compact-section {
            padding-top: 2rem !important;
            padding-bottom: 2rem !important;
          }
        }

        /* Floating buttons responsive sizes */
        @media (max-width: 639px) {
          .floating-button {
            width: 44px !important;
            height: 44px !important;
          }
          .floating-button svg {
            width: 20px !important;
            height: 20px !important;
          }
        }
        
        @media (min-width: 640px) and (max-width: 1023px) {
          .floating-button {
            width: 48px !important;
            height: 48px !important;
          }
          .floating-button svg {
            width: 22px !important;
            height: 22px !important;
          }
        }
        
        @media (min-width: 1024px) {
          .floating-button {
            width: 52px !important;
            height: 52px !important;
          }
          .floating-button svg {
            width: 24px !important;
            height: 24px !important;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>

{/* Banner Section - Negative margin for mobile only */}
<section className="-mt-2 pt-0 sm:pt-2 md:pt-4 lg:pt-6 pb-0 px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden">
  <div className="w-full">
    <BannerCarousel
      height={{ mobile: '280px', desktop: '380px' }}
      rounded={false}
    />
  </div>
</section>

      {/* Categories Section - Using new component */}
      <div ref={categoriesSectionRef}>
        <TopCategories 
          limit={15}
          showHeader={true}
        />
      </div>

      {/* Featured Products Section - Using new component */}
      <div ref={featuredSectionRef}>
        <FeaturedProducts 
          limit={12}
          showHeader={true}
        />
      </div>

      {/* PERSONALIZED RECOMMENDATIONS SECTION */}
      <section className="compact-section bg-white ">
        <div className="w-full">
          {isAuthenticated ? (
            <PersonalizedRecommendations 
              title="Recommended For You"
              limit={12}
              showHeader={true}
              showStrategy={true}
            />
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 lg:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:mr-6 lg:mr-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <MessageSquare size={20} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Personalize Your Experience
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-4 text-sm md:text-base">
                    Sign in to unlock personalized recommendations based on your preferences and shopping history.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/auth/login"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 md:px-5 py-2.5 rounded-lg font-medium transition-all duration-300 inline-flex items-center justify-center shadow-sm hover:shadow text-sm md:text-base"
                    >
                      Sign In
                      <ArrowUp size={16} className="ml-2" />
                    </Link>
                    <Link
                      href="/auth/register"
                      className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-4 md:px-5 py-2.5 rounded-lg font-medium transition-colors inline-flex items-center justify-center text-sm md:text-base"
                    >
                      Create Account
                    </Link>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="w-40 h-40 lg:w-48 lg:h-48 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">✨</div>
                      <div className="text-xs lg:text-sm text-blue-800 font-medium">Tailored Just For You</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>


            {/* New Arrivals Section - Using new component */}
      <div ref={newArrivalsSectionRef}>
        <WoodenUtensilsPage />
      </div>

      {/* New Arrivals Section - Using new component */}
      <div ref={newArrivalsSectionRef}>
        <NewArrivals 
          limit={12}
          showHeader={true}
        />
      </div>

      {/* Promotional Banner - Compact */}
      <section className="compact-section px-4 sm:px-6 md:px-8 lg:px-12 mt-6 sm:mt-8 md:mt-10">
        <div className="w-full">
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="bg-gradient-to-r from-green-500 via-emerald-600 to-green-700 p-4 md:p-6 lg:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="text-white mb-4 md:mb-0 md:mr-6 lg:mr-8">
                  <div className="inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 bg-white/20 rounded-full mb-3 md:mb-4 backdrop-blur-sm">
                    <Gift size={14} />
                    <span className="ml-1.5 md:ml-2 font-medium text-sm md:text-base">Weekend Special</span>
                  </div>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 md:mb-3">Fresh Produce Sale!</h3>
                  <p className="text-base md:text-lg mb-4 md:mb-6 opacity-90">Up to 50% off on organic fruits & vegetables</p>
                  <Link
                    href="/deals"
                    className="inline-flex items-center bg-white text-green-700 px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl text-sm md:text-base"
                  >
                    Shop Now
                    <ArrowUp className="ml-2" size={16} />
                  </Link>
                </div>
                <div className="relative mt-4 md:mt-0">
                  <div className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 md:mb-2">50%</div>
                      <div className="text-base md:text-lg font-semibold">OFF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div ref={newArrivalsSectionRef}>
        <CleaningSupplies />
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="floating-button flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)'
          }}
          aria-label="Chat on WhatsApp"
        >
          <MessageSquare className="text-white" size={20} />
        </a>

        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`floating-button flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 ${
            showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            boxShadow: '0 4px 20px rgba(90, 221, 90, 0.4)'
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="text-white" size={20} />
        </button>

        {/* Customer Support Button */}
        <button
          onClick={() => setShowCustomerSupport(!showCustomerSupport)}
          className="floating-button flex items-center justify-center rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
            boxShadow: '0 4px 20px rgba(90, 221, 90, 0.4)'
          }}
          aria-label="Customer Support"
        >
          <HelpCircle className="text-white" size={20} />
        </button>

        {/* Customer Support Dropdown */}
        {showCustomerSupport && (
          <div className="absolute right-0 bottom-full mb-3 bg-white rounded-xl shadow-2xl border border-gray-200 w-56 md:w-64 overflow-hidden animate-slide-up">
            <div 
              className="p-3 text-white"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`
              }}
            >
              <h3 className="font-bold text-sm md:text-base">Need Help?</h3>
              <p className="text-xs opacity-90">We're here 24/7</p>
            </div>
            
            <div className="p-2 space-y-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-green-100">
                  <MessageSquare size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">WhatsApp</div>
                  <div className="text-xs text-gray-600">Instant reply</div>
                </div>
              </a>
              
              <a
                href="tel:+254716354589"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-blue-100">
                  <Phone size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Call Us</div>
                  <div className="text-xs text-gray-600">+254 716 354 589</div>
                </div>
              </a>
              
              <Link
                href="/help"
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-purple-100">
                  <HelpCircle size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">Help Center</div>
                  <div className="text-xs text-gray-600">FAQs & guides</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;