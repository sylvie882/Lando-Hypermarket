import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Youtube, Leaf } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white pt-12 md:pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
          {/* Company Info */}
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center space-x-2">
              <Leaf className="text-green-400" size={28} />
              <span className="text-xl md:text-2xl font-bold">LANDO RANCH LTD</span>
            </div>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed">
              LANDO HYPERMARKET
            </p>
            <div className="flex space-x-3 pt-2">
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 transition-colors duration-300" aria-label="YouTube">
                <Youtube size={18} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 md:mb-6">Quick Links</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4 md:mb-6">Categories</h3>
            <ul className="space-y-2 md:space-y-3">
              <li>
                <Link href="/categories/fruits" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Fresh Fruits
                </Link>
              </li>
              <li>
                <Link href="/categories/vegetables" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Vegetables
                </Link>
              </li>
              <li>
                <Link href="/categories/dairy" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Dairy & Eggs
                </Link>
              </li>
              <li>
                <Link href="/categories/meat" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Meat & Poultry
                </Link>
              </li>
              <li>
                <Link href="/categories/bakery" className="text-gray-400 hover:text-white transition-colors duration-300 text-sm md:text-base">
                  Bakery
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 md:mb-6">Contact Info</h3>
            <ul className="space-y-3 md:space-y-4">
              <li className="flex items-start gap-3 text-gray-400">
                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                <span className="text-sm md:text-base">Nairobi, Kenya</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Phone size={18} className="flex-shrink-0" />
                <span className="text-sm md:text-base">+254 716 354 589</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400">
                <Mail size={18} className="flex-shrink-0" />
                <span className="text-sm md:text-base break-all">support@landomart.co.ke</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 md:pt-8">
          <p className="text-gray-400 text-sm md:text-base text-center">
            © {currentYear} FreshMart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}