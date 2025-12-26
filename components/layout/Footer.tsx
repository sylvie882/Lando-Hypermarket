import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Brand Column with Logo */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative h-12 w-12">
                <Image
                  src="/logo.jpeg"
                  alt="Lando Ranch Logo"
                  fill
                  className="object-contain"
                  priority
                  sizes="48px"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Lando Ranch</h3>
                <p className="text-gray-300 text-sm mt-1">
                  Premium quality products delivered fresh to your door
                </p>
              </div>
            </div>
            
            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-300">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-white transition-colors text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/new-arrivals" className="text-gray-400 hover:text-white transition-colors text-sm">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/featured" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Featured Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-300">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Returns
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider text-gray-300">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Careers
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <Phone size={16} className="text-gray-400" />
                <a href="tel:+254716354589" className="text-gray-300 hover:text-white transition-colors">
                  +254 (716) 354-589
                </a>
              </div>
              <div className="hidden md:block">•</div>
              <div className="flex items-center space-x-2">
                <Mail size={16} className="text-gray-400" />
                <a href="mailto:info@landoranch.com" className="text-gray-300 hover:text-white transition-colors">
                  info@landoranch.com
                </a>
              </div>
              <div className="hidden md:block">•</div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-gray-300">Nairobi, Kenya</span>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Email for updates"
                className="px-3 py-2 rounded-lg text-sm bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 w-48"
              />
              <button className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>&copy; {currentYear} Lando Ranch. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-gray-300 transition-colors">
                Terms
              </Link>
              <Link href="/sitemap" className="hover:text-gray-300 transition-colors">
                Sitemap
              </Link>
              <Link href="/accessibility" className="hover:text-gray-300 transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}