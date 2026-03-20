import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail, Store, ChevronRight, Clock, Shield, Truck, RotateCcw, Headphones } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const trustBadges = [
    { icon: Truck, label: 'Free Delivery', sub: 'All orders' },
    { icon: Shield, label: 'Secure Payment', sub: 'M-Pesa & Cards' },
    { icon: RotateCcw, label: 'Easy Returns', sub: 'Hassle-free' },
    { icon: Headphones, label: '24/7 Support', sub: 'Always here' },
  ];

  const shopLinks = [
    { label: 'Fresh Vegetables', href: '/categories/vegetables' },
    { label: 'Fresh Fruits', href: '/categories/fruits' },
    { label: 'Pasture Raised Meat', href: '/categories/livestock-1' },
    { label: 'Kienyeji Eggs', href: '/categories/egg' },
    { label: 'Dairy Products', href: '/categories/dairy-products' },
    { label: 'Baby Products', href: '/categories/baby-products' },
  ];

  const supportLinks = [
    { label: 'Contact Us', href: '/support' },
    { label: 'FAQs', href: '/support#faqs' },
    { label: 'Track Your Order', href: '/track-order' },
    { label: 'Returns Policy', href: '/terms#returns' },
    { label: 'Delivery Info', href: '/delivery' },
    { label: 'Accessibility', href: '/accessibility' },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ];

  return (
    <footer className="bg-gray-950 text-gray-300" itemScope itemType="https://schema.org/WPFooter">
      
      {/* Trust Badges Strip */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trustBadges.map((badge) => (
              <div key={badge.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <badge.icon size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{badge.label}</p>
                  <p className="text-xs text-gray-500 leading-tight">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block -ml-2 mb-4" aria-label="Lando Ranch Home">
              <Image src="/logo10.png" alt="Lando Ranch Hypermarket Kenya" width={160} height={55} className="object-cover w-[150px] h-[55px]" />
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Kenya's premier online hypermarket. Fresh farm produce, household essentials & more — delivered fast across Nairobi.
            </p>
            <div className="space-y-2.5 mb-5">
              {[
                { icon: Phone, text: '+254 716 354 589', href: 'tel:+254716354589' },
                { icon: Mail, text: 'landoranchh@gmail.com', href: 'mailto:landoranchh@gmail.com' },
                { icon: MapPin, text: 'Nairobi, Kenya' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2.5">
                  <item.icon size={13} className="text-emerald-500 flex-shrink-0" />
                  {item.href ? (
                    <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">{item.text}</a>
                  ) : (
                    <span className="text-sm text-gray-400">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {[
                { icon: Facebook, label: 'Facebook', href: 'https://facebook.com/landoranch' },
                { icon: Twitter, label: 'Twitter', href: 'https://twitter.com/landoranch' },
                { icon: Instagram, label: 'Instagram', href: 'https://instagram.com/landoranch' },
                { icon: Youtube, label: 'YouTube', href: '#' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-emerald-600 flex items-center justify-center transition-all" aria-label={s.label}>
                  <s.icon size={15} className="text-gray-400 hover:text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4">Shop</h3>
            <ul className="space-y-2.5" role="list">
              {shopLinks.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="flex items-center gap-2 group text-sm text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={12} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/deals" className="flex items-center gap-2 group text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium">
                  <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  🔥 Hot Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4">Support</h3>
            <ul className="space-y-2.5" role="list">
              {supportLinks.map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="flex items-center gap-2 group text-sm text-gray-400 hover:text-white transition-colors">
                    <ChevronRight size={12} className="text-emerald-600 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours + Payments */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-4">Business Hours</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2.5">
                <Clock size={13} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">Mon – Sun</p>
                  <p className="text-xs text-gray-500">6:00 AM – 11:00 PM</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Store size={13} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-white font-medium">Nationwide Delivery</p>
                  <p className="text-xs text-gray-500">Kenya-wide coverage</p>
                </div>
              </div>
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3">We Accept</h3>
            <div className="flex flex-wrap gap-2">
              {['M-Pesa', 'Visa', 'Mastercard', 'Cash'].map(m => (
                <span key={m} className="px-2.5 py-1 text-xs bg-gray-800 text-gray-300 rounded-lg border border-gray-700 font-medium">{m}</span>
              ))}
            </div>
            <div className="mt-4 p-3 bg-emerald-950/50 border border-emerald-900/50 rounded-xl">
              <p className="text-xs text-emerald-400 font-semibold mb-0.5">🛡 Secure Shopping</p>
              <p className="text-xs text-gray-500">All payments are encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-gray-950">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-12 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              © {currentYear} <strong className="text-gray-400">Lando Ranch Hypermarket</strong>. All rights reserved. Made with ❤️ in Kenya.
            </p>
            <div className="flex items-center gap-4 text-xs">
              {legalLinks.map(link => (
                <Link key={link.href} href={link.href} className="text-gray-500 hover:text-gray-300 transition-colors">{link.label}</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
