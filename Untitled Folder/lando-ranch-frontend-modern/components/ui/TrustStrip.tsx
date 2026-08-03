'use client';

import React from 'react';
import { Truck, ShieldCheck, RotateCcw, Headphones } from 'lucide-react';

const items = [
  {
    icon: Truck,
    title: 'Fast Delivery',
    subtitle: 'Nairobi & environs',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payment',
    subtitle: 'M-Pesa & cash on delivery',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    subtitle: 'Hassle-free exchanges',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    subtitle: 'We reply on WhatsApp',
  },
];

const TrustStrip: React.FC = () => {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-12 w-full py-4 md:py-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {items.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[#E8F0FB] text-[#004E9A] flex items-center justify-center flex-shrink-0">
                <item.icon size={20} strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-bold text-gray-900 leading-tight truncate">{item.title}</p>
                <p className="text-[10px] md:text-xs text-gray-500 leading-tight truncate">{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
