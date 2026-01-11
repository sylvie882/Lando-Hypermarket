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
  Leaf
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Logo colors
  const logoColors = {
    dark: '#1a1a1a',
    greenLight: '#9dcc5e',
    greenMedium: '#6a9c3d',
    gold: '#d4af37',
    orange: '#e67e22',
    yellowGold: '#f1c40f',
    red: '#c0392b',
    lightGreenLine: '#a3d977',
  };

  return (
    <footer className="bg-gray-900 text-white pt-8 pb-4">
      {/* Quickmart-style top services bar */}
      <div 
        className="py-4 mb-6"
        style={{ backgroundColor: logoColors.dark }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Truck size={20} style={{ color: logoColors.greenLight }} />
              <span className="text-sm" style={{ color: logoColors.lightGreenLine }}>
                Free Delivery*
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield size={20} style={{ color: logoColors.greenLight }} />
              <span className="text-sm" style={{ color: logoColors.lightGreenLine }}>
                Quality Guarantee
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard size={20} style={{ color: logoColors.greenLight }} />
              <span className="text-sm" style={{ color: logoColors.lightGreenLine }}>
                Secure Payment
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock size={20} style={{ color: logoColors.greenLight }} />
              <span className="text-sm" style={{ color: logoColors.lightGreenLine }}>
                24/7 Customer Support
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Logo & Description */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Leaf 
                style={{ color: logoColors.greenLight }}
                size={28} 
              />
              <span className="text-2xl font-bold">
                <span style={{ color: logoColors.greenMedium }}>LAND</span>
                <span style={{ color: logoColors.gold }}>O</span>
                <span style={{ color: logoColors.red }}> HYPERMARKET</span>
              </span>
            </div>
            <p className="mb-4 text-gray-300 text-sm">
              Your one-stop destination for fresh groceries, quality products, and exceptional value. 
              Serving Kenya with pride since 2010.
            </p>
            {/* Social Media Links */}
            <div className="flex space-x-3 mt-4">
              <a 
                href="https://facebook.com/LandoHypermarketKe" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: logoColors.greenMedium }}
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://twitter.com/LandoHypermarket" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: logoColors.greenMedium }}
                aria-label="Twitter"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="https://instagram.com/LandoHypermarket" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: logoColors.greenMedium }}
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://youtube.com/c/LandoHypermarket" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:opacity-90 transition-opacity"
                style={{ backgroundColor: logoColors.greenMedium }}
                aria-label="YouTube"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links - Quickmart style */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: logoColors.gold }}>
              SHOP WITH US
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/products" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/fruits" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Fresh Fruits
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/vegetables" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Vegetables
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/dairy" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Dairy & Eggs
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/meat" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Meat & Poultry
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/bakery" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Bakery
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: logoColors.gold }}>
              CUSTOMER SERVICE
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/delivery" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Delivery Information
                </Link>
              </li>
              <li>
                <Link 
                  href="/returns" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-white transition-colors text-sm"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info - Quickmart style */}
          <div>
            <h3 className="text-lg font-bold mb-4" style={{ color: logoColors.gold }}>
              CONTACT INFO
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin 
                  size={18} 
                  className="mt-1 flex-shrink-0" 
                  style={{ color: logoColors.orange }}
                />
                <span className="text-gray-300 text-sm">
                  Nairobi, Kenya<br />
                  <span className="text-xs text-gray-400">
                    Multiple locations across the city
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone 
                  size={18} 
                  className="flex-shrink-0" 
                  style={{ color: logoColors.orange }}
                />
                <span className="text-gray-300 text-sm">
                  +254 716 354 589
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail 
                  size={18} 
                  className="flex-shrink-0" 
                  style={{ color: logoColors.orange }}
                />
                <span className="text-gray-300 text-sm break-all">
                  support@landomart.co.ke
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-gray-700 pt-6 mb-6">
          <h4 className="text-sm font-semibold mb-3" style={{ color: logoColors.gold }}>
            ACCEPTED PAYMENT METHODS
          </h4>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="px-3 py-1 bg-gray-800 rounded text-xs">M-Pesa</div>
            <div className="px-3 py-1 bg-gray-800 rounded text-xs">Visa</div>
            <div className="px-3 py-1 bg-gray-800 rounded text-xs">MasterCard</div>
            <div className="px-3 py-1 bg-gray-800 rounded text-xs">Airtel Money</div>
            <div className="px-3 py-1 bg-gray-800 rounded text-xs">Cash on Delivery</div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-2 md:mb-0">
              © {currentYear} LANDO HYPERMARKET. All rights reserved.
            </p>
            <div className="flex space-x-4 text-sm">
              <Link 
                href="/sitemap" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Sitemap
              </Link>
              <Link 
                href="/accessibility" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Accessibility
              </Link>
              <Link 
                href="/cookies" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}