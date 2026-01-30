import React from 'react';
import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  MapPin, 
  Phone, 
  Mail,
  Clock,
  CreditCard,
  Shield,
  Truck,
  ShoppingBag,
  Heart,
  Award,
  Users,
  Smartphone,
  Star,
  Package,
  Headphones,
  Store,
  ChevronRight
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Deep green color scheme - compact version
  const colors = {
    deepGreen: '#0d2818',
    deepGreenLight: '#1a4731',
    greenAccent: '#2E7D32',
    greenBright: '#4CAF50',
    gold: '#FFC107',
    lightGreen: '#8BC34A',
    textLight: '#cccccc',
    textLighter: '#e0e0e0'
  };

  return (
    <footer className="text-white" style={{ backgroundColor: colors.deepGreen }}>
      {/* Main Footer Content - Compact */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Brand & Contact */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: colors.greenBright }}>
                <ShoppingBag size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">
                  <span className="text-white">LANDO</span>
                  <span style={{ color: colors.gold }}> </span>
                  <span className="text-white">HYPERMARKET</span>
                </h1>
                <p className="text-xs mt-0.5" style={{ color: colors.lightGreen }}>
                  Trusted Since 2010
                </p>
              </div>
            </div>
            
            <p className="mb-4 text-xs leading-relaxed" style={{ color: colors.textLight }}>
              Your premier online supermarket for fresh groceries and household essentials at competitive prices.
            </p>
            
            {/* Contact */}
            <div className="mb-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: colors.gold }} />
                <span className="text-sm font-medium text-white">+254 716 354 589</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} style={{ color: colors.gold }} />
                <span className="text-xs" style={{ color: colors.textLight }}>support@landohypermarket.co.ke</span>
              </div>
            </div>
            
            {/* Social */}
            <div>
              <div className="flex gap-2">
                {[
                  { icon: Facebook, color: '#1877F2' },
                  { icon: Twitter, color: '#1DA1F2' },
                  { icon: Instagram, color: '#E4405F' },
                  { icon: Youtube, color: '#FF0000' }
                ].map((social, index) => (
                  <a 
                    key={index}
                    href="#"
                    className="p-1.5 rounded transition-transform hover:scale-110"
                    style={{ backgroundColor: colors.deepGreenLight }}
                    aria-label={social.icon.name}
                  >
                    <social.icon size={14} className="text-white" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-sm font-bold mb-3 pb-2 uppercase tracking-wider" style={{ 
              color: colors.gold,
              borderBottom: `1px solid ${colors.greenAccent}`
            }}>
              Shop
            </h3>
            <ul className="space-y-1.5">
              {['Fresh Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Bakery', 'Beverages', 'Household'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/categories/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-xs group-hover:text-white transition-colors" style={{ color: colors.textLight }}>
                      {item}
                    </span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.gold }} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-bold mb-3 pb-2 uppercase tracking-wider" style={{ 
              color: colors.gold,
              borderBottom: `1px solid ${colors.greenAccent}`
            }}>
              Help
            </h3>
            <ul className="space-y-1.5">
              {['Contact Us', 'FAQs', 'Delivery Info', 'Returns', 'Track Order', 'Stores'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-xs group-hover:text-white transition-colors" style={{ color: colors.textLight }}>
                      {item}
                    </span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.gold }} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h3 className="text-sm font-bold mb-3 pb-2 uppercase tracking-wider" style={{ 
              color: colors.gold,
              borderBottom: `1px solid ${colors.greenAccent}`
            }}>
              Company
            </h3>
            <ul className="space-y-1.5 mb-4">
              {['About Us', 'Careers', 'Wholesale', 'Terms', 'Privacy', 'Sitemap'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="flex items-center justify-between group"
                  >
                    <span className="text-xs group-hover:text-white transition-colors" style={{ color: colors.textLight }}>
                      {item}
                    </span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: colors.gold }} />
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Newsletter - Compact */}
            <div>
              <div className="flex mb-2">
                <input 
                  type="email" 
                  placeholder="Email for deals"
                  className="flex-1 px-2 py-1.5 text-xs rounded-l focus:outline-none"
                  style={{ 
                    backgroundColor: colors.deepGreenLight,
                    color: 'white',
                    border: `1px solid ${colors.greenAccent}`
                  }}
                />
                <button 
                  className="px-3 py-1.5 text-xs font-medium rounded-r transition-colors hover:opacity-90"
                  style={{ backgroundColor: colors.gold, color: colors.deepGreen }}
                >
                  Join
                </button>
              </div>
              <p className="text-xs" style={{ color: colors.lightGreen }}>
                Get exclusive offers
              </p>
            </div>
          </div>
        </div>

        {/* Payment & Trust Badges - Single Row */}
        <div className="py-4 border-t border-b" style={{ borderColor: colors.greenAccent }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <div className="text-xs font-medium mb-2 text-white">Payment Methods</div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-1.5">
                {['M-Pesa', 'Visa', 'MasterCard', 'Cash'].map((method) => (
                  <span 
                    key={method}
                    className="px-2 py-0.5 text-xs rounded"
                    style={{ 
                      backgroundColor: colors.deepGreenLight,
                      color: colors.lightGreen,
                      border: `1px solid ${colors.greenAccent}`
                    }}
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <div className="text-xs font-medium mb-2 text-white">Trusted & Secure</div>
              <div className="flex justify-center sm:justify-end gap-3">
                <div className="flex items-center gap-1">
                  <Shield size={12} style={{ color: colors.greenBright }} />
                  <span className="text-xs" style={{ color: colors.lightGreen }}>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package size={12} style={{ color: colors.greenBright }} />
                  <span className="text-xs" style={{ color: colors.lightGreen }}>Fast Delivery</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award size={12} style={{ color: colors.greenBright }} />
                  <span className="text-xs" style={{ color: colors.lightGreen }}>Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Compact */}
        <div className="pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-3">
            <div className="text-center sm:text-left">
              <p className="text-xs" style={{ color: colors.textLight }}>
                © {currentYear} <span className="font-medium text-white">LANDO HYPERMARKET</span>
                <span className="hidden sm:inline mx-1">•</span>
                <span className="block sm:inline mt-1 sm:mt-0">All rights reserved</span>
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <Link 
                href="/privacy"
                className="hover:text-white transition-colors"
                style={{ color: colors.textLight }}
              >
                Privacy
              </Link>
              <Link 
                href="/terms"
                className="hover:text-white transition-colors"
                style={{ color: colors.textLight }}
              >
                Terms
              </Link>
              <Link 
                href="/cookies"
                className="hover:text-white transition-colors"
                style={{ color: colors.textLight }}
              >
                Cookies
              </Link>
              <Link 
                href="/accessibility"
                className="hover:text-white transition-colors"
                style={{ color: colors.textLight }}
              >
                Accessibility
              </Link>
            </div>
          </div>
          
          {/* Store Info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Store size={10} style={{ color: colors.greenBright }} />
              <span className="text-xs" style={{ color: colors.lightGreen }}>
                Multiple branches nationwide
              </span>
            </div>
            <p className="text-xs" style={{ color: '#999' }}>
              Mon-Sun: 6AM - 11PM • Call: <span className="font-medium" style={{ color: colors.gold }}>+254 716 354 589</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}