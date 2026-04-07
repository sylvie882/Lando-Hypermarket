'use client';

import React, { useEffect, useState, useCallback } from 'react';
import BannerCarousel from '@/components/ui/BannerCarousel';
import TopCategories from '@/components/ui/TopCategories';
import FeaturedProducts from '@/components/ui/FeaturedProducts';
import WoodenUtensilsPage from '@/components/ui/WoodenUtensils';
import HandicraftsPage from '@/components/ui/Handicrafts';
import NewArrivals from '@/components/ui/NewArrivals';
import PersonalizedRecommendations from '@/components/ui/PersonalizedRecommendations';
import ProductsPage from '@/components/ui/ProductsPage';
import OffersTickerStrip from '@/components/ui/OffersTickerStrip';
import { api } from '@/lib/api';

import {
  ArrowUp, HelpCircle, Phone, Gift, MessageSquare, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface OfferItem {
  id: number;
  name: string;
  price: string;
  badge: string;
}

const HomePage: React.FC = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  const [offers, setOffers] = useState<OfferItem[]>([]);

  const whatsappNumber = '+254716354589';
  const whatsappMessage = encodeURIComponent('Hello! I have a question about your products.');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Fetch featured products for the offers ticker
  useEffect(() => {
    api.products.getFeatured()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        const mapped: OfferItem[] = data
          .filter((p: any) => p.is_active && p.is_featured)
          .map((p: any) => ({
            id: p.id,                                              // ← product id for the link
            name: p.name,
            price: `KES ${Number(p.final_price).toLocaleString()}`,
            badge: p.discounted_price ? 'SALE' : 'FEATURED',
          }));
        setOffers(mapped);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            entry.target.classList.remove('section-hidden');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
    );

    const sections = document.querySelectorAll('.reveal-section');
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Banner ── */}
      <section className="-mt-2 pt-0 sm:pt-2 md:pt-4 pb-0 overflow-hidden">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">

          {offers.length > 0 && <OffersTickerStrip offers={offers} />}

          <BannerCarousel
            height={{ mobile: '280px', desktop: '390px' }}
            rounded={false}
          />
        </div>
      </section>

      {/* ── Top Categories ── */}
      <div className="reveal-section section-hidden">
        <TopCategories limit={15} showHeader={true} />
      </div>

      {/* ── All Products ── */}
      <div className="reveal-section section-hidden mt-2">
        <ProductsPage />
      </div>

      {/* ── Featured Products ── */}
      <div className="reveal-section section-hidden">
        <FeaturedProducts limit={12} showHeader={true} />
      </div>

      {/* ── Handicrafts ── */}
      <div className="reveal-section section-hidden">
        <HandicraftsPage />
      </div>

      {/* ── Personalized Recommendations ── */}
      <div className="reveal-section section-hidden">
        <PersonalizedRecommendations
          title="Recommended For You"
          limit={12}
          showHeader={true}
          showStrategy={false}
        />
      </div>

      {/* ── Wooden Utensils ── */}
      <div className="reveal-section section-hidden">
        <WoodenUtensilsPage />
      </div>

      {/* ── New Arrivals ── */}
      <div className="reveal-section section-hidden">
        <NewArrivals limit={48} showHeader={true} />
      </div>

      {/* ── Promotional Banner ── */}
      <section className="py-8 sm:py-10 md:py-12 reveal-section section-hidden">
        <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br bg-blue-600" />
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5 blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-emerald-400/20 blur-lg" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-yellow-400/10" />

            <div className="relative z-10 p-6 md:p-8 lg:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-white">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full mb-4 backdrop-blur-sm border border-white/20 text-sm font-medium">
                    <Gift size={14} />
                    Weekend Special
                  </div>
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 leading-tight">
                    Fresh Produce Sale!
                  </h3>
                  <p className="text-base md:text-lg opacity-85 mb-6 max-w-md">
                    Up to 50% off on organic fruits &amp; vegetables. Limited time offer — shop before it&apos;s gone.
                  </p>
                  <Link
                    href="/deals"
                    className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base group"
                  >
                    Shop Now
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>

                <div className="flex-shrink-0">
                  <div className="w-28 h-28 md:w-36 md:h-36 lg:w-44 lg:h-44 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20">
                    <div className="text-center text-white">
                      <div className="text-4xl md:text-5xl font-bold leading-none">50%</div>
                      <div className="text-sm font-semibold tracking-widest opacity-90 mt-1">OFF</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating Action Buttons ── */}
      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="fab w-12 h-12 flex items-center justify-center rounded-full shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #004E9A, #004E9A)',
            boxShadow: '0 4px 20px rgba(49, 37, 211, 0.45)'
          }}
          aria-label="Chat on WhatsApp"
        >
          <MessageSquare className="text-white" size={20} />
        </a>

        {/* Scroll to Top */}
        <button
          onClick={scrollToTop}
          className={`fab w-12 h-12 flex items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
            showScrollTop ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
          style={{
            background: 'linear-gradient(135deg, #004E9A, #004E9A)',
            boxShadow: '0 4px 20px rgba(58, 23, 214, 0.45)'
          }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="text-white" size={20} />
        </button>

        {/* Support */}
        <button
          onClick={() => setShowCustomerSupport(!showCustomerSupport)}
          className="fab w-12 h-12 flex items-center justify-center rounded-full shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.45)'
          }}
          aria-label="Customer Support"
        >
          <HelpCircle className="text-white" size={20} />
        </button>

        {/* Support Dropdown */}
        {showCustomerSupport && (
          <div className="absolute right-0 bottom-full mb-3 bg-white rounded-2xl shadow-2xl border border-gray-100 w-60 overflow-hidden toast-enter">
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600">
              <h3 className="font-bold text-sm text-white">Need Help?</h3>
              <p className="text-xs text-white/80 mt-0.5">We&apos;re here 24/7 for you</p>
            </div>
            <div className="p-2 space-y-1">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                  <MessageSquare size={15} className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">WhatsApp</div>
                  <div className="text-xs text-gray-500">Instant reply</div>
                </div>
              </a>

              <a
                href="tel:+254716354589"
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Phone size={15} className="text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Call Us</div>
                  <div className="text-xs text-gray-500">+254 716 354 589</div>
                </div>
              </a>

              <Link
                href="/support"
                onClick={() => setShowCustomerSupport(false)}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <HelpCircle size={15} className="text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Help Center</div>
                  <div className="text-xs text-gray-500">FAQs &amp; guides</div>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .section-hidden { opacity: 0; transform: translateY(22px); }
        .animate-fade-up { animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default HomePage;