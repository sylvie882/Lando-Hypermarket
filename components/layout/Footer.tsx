import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  MapPin, 
  Phone, 
  Mail,
  Store,
  ChevronRight,
  Clock
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Brand & Contact */}
          <div>
            <Link href="/" className="inline-block ml-[-30px]">
              <Image 
                src="/logo10.png" 
                alt="Lando Logo" 
                width={160} 
                height={50} 
                className="object-cover w-[160px] h-[60px]"
                priority
              />
            </Link>
            
            <div className="space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-green-400" />
                <span className="text-sm">+254 716 354 589</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-green-400" />
                <span className="text-sm">landoranchh@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-green-400" />
                <span className="text-sm">Nairobi, Kenya</span>
              </div>
            </div>
            
            {/* Social */}
            <div className="flex gap-2 mt-4">
              {[
                { icon: Facebook, label: 'Facebook' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Instagram, label: 'Instagram' },
                { icon: Youtube, label: 'YouTube' }
              ].map((social, index) => (
                <a 
                  key={index}
                  href="#"
                  className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all"
                  aria-label={social.label}
                >
                  <social.icon size={16} className="text-gray-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-green-400">
              Shop
            </h3>
            <ul className="space-y-2">
              {['Fresh Produce', 'Dairy & Eggs', 'Meat & Poultry', 'Bakery', 'Beverages'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/categories/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                    className="flex items-center justify-between group text-sm"
                  >
                    <span className="text-gray-300 group-hover:text-white">
                      {item}
                    </span>
                    <ChevronRight size={14} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-green-400">
              Support
            </h3>
            <ul className="space-y-2">
              {['Contact Us', 'FAQs', 'Delivery Info', 'Returns'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="flex items-center justify-between group text-sm"
                  >
                    <span className="text-gray-300 group-hover:text-white">
                      {item}
                    </span>
                    <ChevronRight size={14} className="text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-green-400">
              Hours
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-green-400" />
                <span className="text-sm">Mon-Sun: 6AM - 11PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Store size={14} className="text-green-400" />
                <span className="text-sm">Nationwide</span>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div className="mt-4">
              <div className="flex flex-wrap gap-1.5">
                {['M-Pesa', 'Visa', 'MasterCard'].map((method) => (
                  <span 
                    key={method}
                    className="px-2 py-1 text-xs bg-gray-800 text-gray-300 rounded border border-gray-700"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-gray-800">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-400">
              © {currentYear} LANDO HYPERMARKET. All rights reserved.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 text-xs">
              <Link href="/privacy" className="text-gray-400 hover:text-white">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white">
                Terms
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}