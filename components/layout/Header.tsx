'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, Menu, ShoppingCart, ChevronDown, X, Home, Store, User, LayoutGrid, ShoppingBag, MapPin, LogOut, Heart, Package, User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<string>('Detecting location...');
  const [isLocating, setIsLocating] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch cart count
  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const response = await api.cart.getCount();
      const count = response.data?.count || response.data || 0;
      setCartCount(Number(count));
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount, isAuthenticated]);

  // Get user location
  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
            );
            const data = await response.json();
            const city = data.city || data.locality || data.principalSubdivision || 'Unknown location';
            setLocation(city);
          } catch (error) {
            setLocation('Location detected');
            console.error('Error getting location name:', error);
          }
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation('Nairobi, Kenya');
          setIsLocating(false);
        }
      );
    } else {
      setLocation('Nairobi, Kenya');
      setIsLocating(false);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        const data = response.data || [];
        const parentCategories = data.filter((category: Category) => category.is_active);
        
        const sampleCategories = [
          { id: 101, name: 'Electronics', slug: 'electronics', is_active: true },
          { id: 102, name: 'Fashion', slug: 'fashion', is_active: true },
          { id: 103, name: 'Home & Living', slug: 'home-living', is_active: true },
          { id: 104, name: 'Beauty', slug: 'beauty', is_active: true },
          { id: 105, name: 'Sports', slug: 'sports', is_active: true },
          { id: 106, name: 'Toys', slug: 'toys', is_active: true },
          { id: 107, name: 'Books', slug: 'books', is_active: true },
          { id: 108, name: 'Automotive', slug: 'automotive', is_active: true },
          { id: 109, name: 'Pet Supplies', slug: 'pet-supplies', is_active: true },
          { id: 110, name: 'Baby Products', slug: 'baby-products', is_active: true },
          { id: 111, name: 'Garden', slug: 'garden', is_active: true },
        ];
        
        const combined = [...parentCategories, ...sampleCategories];
        const uniqueCategories = combined.filter((cat, index, self) => 
          index === self.findIndex((c) => c.slug === cat.slug)
        );
        setCategories(uniqueCategories.slice(0, 11));
      } catch (error) {
        console.error('Error fetching categories:', error);
        const sampleCategories = [
          { id: 1, name: 'Electronics', slug: 'electronics', is_active: true },
          { id: 2, name: 'Fashion', slug: 'fashion', is_active: true },
          { id: 3, name: 'Home & Living', slug: 'home-living', is_active: true },
          { id: 4, name: 'Beauty', slug: 'beauty', is_active: true },
          { id: 5, name: 'Sports', slug: 'sports', is_active: true },
          { id: 6, name: 'Toys', slug: 'toys', is_active: true },
          { id: 7, name: 'Books', slug: 'books', is_active: true },
          { id: 8, name: 'Automotive', slug: 'automotive', is_active: true },
          { id: 9, name: 'Pet Supplies', slug: 'pet-supplies', is_active: true },
          { id: 10, name: 'Baby Products', slug: 'baby-products', is_active: true },
          { id: 11, name: 'Garden', slug: 'garden', is_active: true },
        ];
        setCategories(sampleCategories);
      }
    };
    fetchCategories();
  }, []);

  
  const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  if (searchQuery.trim()) {
    // Change from 'q' to 'search' to match what ProductsPage expects
    router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    setSearchQuery('');
  }
};



  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      setAccountMenuOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const visibleCategories = categories.slice(0, 11);

  // Consistent padding class for all sections
  const containerPadding = "px-4 sm:px-6 md:px-8 lg:px-12";

  return (
    <>
      {/* Single Sticky Container - Light Dim Green Background */}
      <div className={`sticky top-0 z-50 bg-[#F8FAF5] shadow-md ${containerPadding}`}>
        {/* Top Header - Same Light Dim Green with Warm Orange Borders */}
        <div className="bg-[#F8FAF5] text-gray-700 py-2 border-b border-[#E67E22]">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="flex items-center px-3 py-1 border border-[#E67E22] rounded-full">
                <img src="/images/schedule.png" alt="Scheduled" className="w-4 h-4 sm:w-5 sm:h-5 object-contain mr-1.5" />
                <span className="text-xs sm:text-sm text-[#E67E22] font-medium">Scheduled</span>
              </span>
              <span className="flex items-center px-3 py-1 border border-[#E67E22] rounded-full">
                <img src="/images/express.png" alt="Express" className="w-4 h-4 sm:w-5 sm:h-5 object-contain mr-1.5" />
                <span className="text-xs sm:text-sm text-[#E67E22] font-medium">Express</span>
              </span>
            </div>
            <div className="hidden md:flex items-center">
              <span className="text-sm text-gray-700">+254 716 354 589</span>
            </div>
          </div>
        </div>

        {/* Desktop Header - Same Light Dim Green */}
        <div className="hidden md:block bg-[#F8FAF5]">
          <div className="flex items-center justify-between py-3">
            {/* Logo and Store Name - Stacked with Warm Orange Lando */}
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/logotwo.png" 
                alt="Lando Logo" 
                width={60} 
                height={60} 
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[#E67E22] leading-tight">Lando</span>
                <span className="text-sm font-medium text-[#2E7D32] tracking-wide">Hypermarket</span>
              </div>
            </Link>
            
            {/* Location with GPS */}
            <button 
              onClick={getLocation}
              className="flex items-center space-x-1 text-gray-700 hover:text-[#E67E22] transition-colors group"
            >
              <MapPin size={18} className="text-[#E67E22]" />
              <span className="text-sm font-medium group-hover:text-[#E67E22]">
                {isLocating ? 'Detecting...' : location}
              </span>
              <ChevronDown size={14} className="text-gray-500 group-hover:text-[#E67E22]" />
            </button>

            {/* Search Bar with Warm Orange Button */}
            <form onSubmit={handleSearch} className="flex flex-1 mx-4 max-w-xl">
              <input
                type="search"
                placeholder="50,000+ items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white"
              />
              <button type="submit" className="bg-[#E67E22] text-white px-4 rounded-r-lg hover:bg-[#D35400] transition-colors">
                <Search size={20} />
              </button>
            </form>

            {/* Account Section with Warm Orange Accents */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[#E67E22] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#E67E22] flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium group-hover:text-[#E67E22]">{user.name?.split(' ')[0] || 'Account'}</span>
                    <span className="text-xs text-gray-500">My Account</span>
                  </div>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown */}
                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                      {/* User Info */}
                      <div className="bg-[#E6F3E6] p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-[#E67E22] flex items-center justify-center">
                            <User size={20} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                            <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <UserIcon size={16} className="mr-3 text-gray-500" />
                          My Profile
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <Package size={16} className="mr-3 text-gray-500" />
                          My Orders
                        </Link>
                        <Link
                          href="/wishlist"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <Heart size={16} className="mr-3 text-gray-500" />
                          Wishlist
                        </Link>
                        <div className="border-t border-gray-200 my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={16} className="mr-3" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-[#E67E22] hover:text-[#D35400] transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                >
                  Login
                </Link>
                <span className="text-gray-400">|</span>
                <Link
                  href="/auth/register"
                  className="text-sm font-medium text-[#E67E22] hover:text-[#D35400] transition-colors px-3 py-2 rounded-md hover:bg-white/50"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Cart Icon with Warm Orange */}
            <Link href="/cart" className="relative ml-2">
              <ShoppingCart size={24} className="text-[#E67E22]" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E67E22] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Header - Same Light Dim Green */}
        <div className="md:hidden py-3 bg-[#F8FAF5]">
          {/* Logo and Location Row */}
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/logotwo.png" 
                alt="Lando Logo" 
                width={45} 
                height={45} 
                className="object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-[#E67E22] leading-tight">Lando</span>
                <span className="text-[10px] font-medium text-[#2E7D32] tracking-wide">Hypermarket</span>
              </div>
            </Link>
            
            {/* Location with GPS - Mobile */}
            <button 
              onClick={getLocation}
              className="flex items-center space-x-1 text-gray-700 hover:text-[#E67E22] transition-colors"
            >
              <MapPin size={16} className="text-[#E67E22]" />
              <span className="text-xs font-medium truncate max-w-[120px]">
                {isLocating ? 'Detecting...' : location}
              </span>
              <ChevronDown size={12} className="text-gray-500" />
            </button>
          </div>
          
          {/* Search Bar and Account Row */}
          <div className="flex items-center space-x-2">
            <form onSubmit={handleSearch} className="flex flex-1">
              <input
                type="search"
                placeholder="50,000+ items"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#E67E22] text-sm bg-white"
              />
              <button type="submit" className="bg-[#E67E22] text-white px-3 rounded-r-lg">
                <Search size={18} />
              </button>
            </form>
            
            {/* Mobile Account Icon */}
            <Link 
              href={isAuthenticated ? "/profile" : "/auth/login"} 
              className="p-2 bg-white rounded-lg border border-gray-300"
            >
              <User size={18} className="text-[#E67E22]" />
            </Link>
          </div>
        </div>

        {/* Desktop Categories - Same Light Dim Green with Warm Orange Accents */}
        <nav className="bg-[#F8FAF5] hidden md:block border-t border-[#E67E22]/30">
          <div className="flex items-center py-2">
            {/* All Categories Button with Warm Orange */}
            <button
              className="flex items-center px-3 py-2 text-[#E67E22] hover:bg-white/50 rounded-md transition-colors border border-transparent hover:border-[#E67E22]/30"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={18} />
              <span className="ml-2 text-sm font-medium">All Categories</span>
              <ChevronDown size={16} className="ml-1" />
            </button>
            
            {/* Divider */}
            <div className="h-6 w-px bg-gray-400 mx-3"></div>
            
            {/* Categories - Desktop only */}
            <div className="flex items-center space-x-4 overflow-x-auto hide-scrollbar">
              {visibleCategories.map((category) => (
                <a 
                  key={category.id} 
                  href={`https://hypermarket.co.ke/categories/${category.slug}`}
                  className="text-gray-700 hover:text-[#E67E22] whitespace-nowrap text-sm font-medium transition-colors"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Bottom Navigation with Warm Orange Active State */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 shadow-lg">
        <div className="flex justify-around items-center py-1 px-4">
          <Link href="/" className="flex flex-col items-center p-1 w-16">
            <Home size={20} className={pathname === '/' ? 'text-[#E67E22]' : 'text-gray-600'} />
            <span className={`text-[10px] mt-0.5 ${pathname === '/' ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Home</span>
          </Link>
          
          <Link href="/products" className="flex flex-col items-center p-1 w-16">
            <ShoppingBag size={20} className={pathname === '/products' ? 'text-[#E67E22]' : 'text-gray-600'} />
            <span className={`text-[10px] mt-0.5 ${pathname === '/products' ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Shop</span>
          </Link>
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center p-1 w-16"
          >
            <LayoutGrid size={20} className={mobileMenuOpen ? 'text-[#E67E22]' : 'text-gray-600'} />
            <span className={`text-[10px] mt-0.5 ${mobileMenuOpen ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Categories</span>
          </button>
          
          <Link href={isAuthenticated ? "/profile" : "/auth/login"} className="flex flex-col items-center p-1 w-16">
            <User size={20} className={pathname === '/profile' ? 'text-[#E67E22]' : 'text-gray-600'} />
            <span className={`text-[10px] mt-0.5 ${pathname === '/profile' ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Profile</span>
          </Link>
          
          <Link href="/cart" className="flex flex-col items-center p-1 w-16 relative">
            <div className="relative">
              <ShoppingCart size={20} className={pathname === '/cart' ? 'text-[#E67E22]' : 'text-gray-600'} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#E67E22] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-0.5 ${pathname === '/cart' ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Cart</span>
          </Link>
        </div>
      </div>

      {/* Mobile Menu Drawer - Full Categories with Warm Orange Accents */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#E67E22]">All Categories</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col space-y-1">
                {categories.map((category) => (
                  <a 
                    key={category.id} 
                    href={`https://hypermarket.co.ke/categories/${category.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 hover:text-[#E67E22] hover:bg-[#E6F3E6] px-4 py-3 rounded-md text-base font-medium transition-colors border-b border-gray-100 last:border-0"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Categories Dropdown with Warm Orange Accents */}
      {mobileMenuOpen && (
        <div className="hidden md:block absolute z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[240px]" style={{ marginLeft: 'calc(1rem + 16px)' }}>
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-[#E67E22] uppercase tracking-wider border-b border-gray-100">
              All Categories
            </div>
            {categories.map((category) => (
              <a
                key={category.id}
                href={`https://hypermarket.co.ke/categories/${category.slug}`}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Add padding to body to prevent content from hiding behind bottom navigation on mobile */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 70px;
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default Header;