import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Youtube, Leaf } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Logo colors from description
  const logoColors = {
    dark: '#1a1a1a', // very dark charcoal
    greenLight: '#9dcc5e', // light green
    greenMedium: '#6a9c3d', // medium green
    gold: '#d4af37', // gold/beige
    orange: '#e67e22', // orange
    yellowGold: '#f1c40f', // yellow-gold highlight
    red: '#c0392b', // red
    lightGreenLine: '#a3d977', // light green line
  };

  return (
    <footer 
      className="pt-12 md:pt-16 pb-8 text-white"
      style={{
        background: `linear-gradient(to bottom, ${logoColors.dark}, black)`
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Company Info */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center space-x-2">
              <Leaf 
                style={{ color: logoColors.greenLight }}
                size={28} 
              />
              <span className="text-xl md:text-2xl font-bold">
                <span style={{ color: logoColors.greenMedium }}>LAND</span>
                <span style={{ color: logoColors.gold }}>O</span>
                <span style={{ color: logoColors.red }}> HYPERMARKET</span>
              </span>
            </div>
            <div className="flex space-x-3 pt-2">
              <a 
                href="#" 
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" 
                aria-label="Facebook"
                style={{ backgroundColor: `${logoColors.greenMedium}30` }}
              >
                <Facebook size={18} style={{ color: logoColors.greenLight }} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" 
                aria-label="Instagram"
                style={{ backgroundColor: `${logoColors.greenMedium}30` }}
              >
                <Instagram size={18} style={{ color: logoColors.greenLight }} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" 
                aria-label="Twitter"
                style={{ backgroundColor: `${logoColors.greenMedium}30` }}
              >
                <Twitter size={18} style={{ color: logoColors.greenLight }} />
              </a>
              <a 
                href="#" 
                className="p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" 
                aria-label="YouTube"
                style={{ backgroundColor: `${logoColors.greenMedium}30` }}
              >
                <Youtube size={18} style={{ color: logoColors.greenLight }} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 md:mb-6" style={{ color: logoColors.gold }}>
              Quick Links
            </h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link 
                  href="/about" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/blog" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link 
                  href="/careers" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4 md:mb-6" style={{ color: logoColors.gold }}>
              Categories
            </h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link 
                  href="/categories/fruits" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Fresh Fruits
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/vegetables" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Vegetables
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/dairy" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Dairy & Eggs
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/meat" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Meat & Poultry
                </Link>
              </li>
              <li>
                <Link 
                  href="/categories/bakery" 
                  className="hover:text-white transition-colors duration-300 text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Bakery
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 md:mb-6" style={{ color: logoColors.gold }}>
              Contact Info
            </h3>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-start gap-3">
                <MapPin 
                  size={18} 
                  className="mt-0.5 flex-shrink-0" 
                  style={{ color: logoColors.orange }}
                />
                <span 
                  className="text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  Nairobi, Kenya
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone 
                  size={18} 
                  className="flex-shrink-0" 
                  style={{ color: logoColors.orange }}
                />
                <span 
                  className="text-sm md:text-base"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  +254 716 354 589
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail 
                  size={18} 
                  className="flex-shrink-0" 
                  style={{ color: logoColors.orange }}
                />
                <span 
                  className="text-sm md:text-base break-all"
                  style={{ color: logoColors.lightGreenLine }}
                >
                  support@landomart.co.ke
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div 
          className="border-t pt-6 md:pt-8"
          style={{ borderColor: `${logoColors.greenMedium}40` }}
        >
          <p 
            className="text-sm md:text-base text-center"
            style={{ color: logoColors.lightGreenLine }}
          >
            © {currentYear} LANDO HYPERMARKET. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}