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
  ShoppingBag,
  Shield,
  Package,
  Award,
  Store,
  ChevronRight,
  Clock,
  Truck,
  Headphones
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          
          {/* Brand & Contact */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-green-700">
                <ShoppingBag size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  LANDO HYPERMARKET
                </h1>
                <p className="text-sm text-green-400 mt-1">
                  Trusted Since 2010
                </p>
              </div>
            </div>
            
            <p className="mb-6 text-gray-300 leading-relaxed">
              Your premier online supermarket for fresh groceries and household essentials at competitive prices.
            </p>
            
            {/* Contact */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-400" />
                <span className="font-medium">+254 716 354 589</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-green-400" />
                <span className="text-gray-300">landoranchh@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-green-400" />
                <span className="text-gray-300">Nairobi, Kenya</span>
              </div>
            </div>
            
            {/* Social */}
            <div className="mt-6">
              <div className="flex gap-3">
                {[
                  { icon: Facebook, color: '#1877F2', label: 'Facebook' },
                  { icon: Twitter, color: '#1DA1F2', label: 'Twitter' },
                  { icon: Instagram, color: '#E4405F', label: 'Instagram' },
                  { icon: Youtube, color: '#FF0000', label: 'YouTube' }
                ].map((social, index) => (
                  <a 
                    key={index}
                    href="#"
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                    style={{ backgroundColor: '#1f2937' }}
                    aria-label={social.label}
                  >
                    <social.icon size={18} className="text-gray-300" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h3 className="text-lg font-bold mb-5 pb-3 uppercase tracking-wider border-b border-gray-700 text-green-400">
              Shop Categories
            </h3>
            <ul className="space-y-2.5">
              {['Fresh Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Bakery', 'Beverages', 'Household'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/categories/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                    className="flex items-center justify-between group hover:translate-x-1 transition-transform duration-200"
                  >
                    <span className="text-gray-300 group-hover:text-white">
                      {item}
                    </span>
                    <ChevronRight size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-5 pb-3 uppercase tracking-wider border-b border-gray-700 text-green-400">
              Help & Support
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Contact Us', icon: Headphones },
                { label: 'FAQs', icon: null },
                { label: 'Delivery Info', icon: Truck },
                { label: 'Returns', icon: null },
                { label: 'Track Order', icon: null },
                { label: 'Store Locations', icon: Store }
              ].map((item) => (
                <li key={item.label}>
                  <Link 
                    href={`/${item.label.toLowerCase().replace(/ /g, '-')}`}
                    className="flex items-center justify-between group hover:translate-x-1 transition-transform duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon && <item.icon size={16} className="text-green-400" />}
                      <span className="text-gray-300 group-hover:text-white">
                        {item.label}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-bold mb-5 pb-3 uppercase tracking-wider border-b border-gray-700 text-green-400">
              Newsletter
            </h3>
            <p className="text-gray-300 mb-5">
              Subscribe to get exclusive offers and the latest news.
            </p>
            
            <div className="space-y-3">
              <div className="flex">
          
              </div>
              
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={18} className="text-green-400" />
                  <span className="font-medium">Secure Shopping</span>
                </div>
                <p className="text-sm text-gray-400">
                  100% secure payments with SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust & Payment Section */}
        <div className="py-6 border-t border-b border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Trust Badges */}
            <div className="text-center lg:text-left">
              <div className="text-sm font-medium mb-3">Why Shop With Us</div>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <Shield size={16} className="text-green-400" />
                  <span className="text-sm">100% Secure</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <Truck size={16} className="text-green-400" />
                  <span className="text-sm">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                  <Award size={16} className="text-green-400" />
                  <span className="text-sm">Quality Guarantee</span>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="text-center lg:text-right">
              <div className="text-sm font-medium mb-3">Payment Methods</div>
              <div className="flex flex-wrap justify-center lg:justify-end gap-2">
                {['M-Pesa', 'Visa', 'MasterCard', 'Cash on Delivery'].map((method) => (
                  <span 
                    key={method}
                    className="px-3 py-1.5 text-sm bg-gray-800 text-gray-300 rounded-lg border border-gray-700"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-4">
            <div className="text-center lg:text-left">
              <p className="text-gray-400">
                © {currentYear} <span className="font-bold text-white">LANDO HYPERMARKET</span>
                <span className="hidden lg:inline mx-2">•</span>
                <span className="block lg:inline mt-1 lg:mt-0">All rights reserved</span>
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link 
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link 
                href="/cookies"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cookies
              </Link>
              <Link 
                href="/accessibility"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
            </div>
          </div>
          
          {/* Store Info */}
          <div className="text-center pt-4 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Store size={14} className="text-green-400" />
                <span className="text-gray-400">Multiple branches nationwide</span>
              </div>
              <div className="hidden sm:block text-gray-600">•</div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-green-400" />
                <span className="text-gray-400">Mon-Sun: 6AM - 11PM</span>
              </div>
              <div className="hidden sm:block text-gray-600">•</div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-green-400" />
                <span className="font-medium text-green-400">+254 716 354 589</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}