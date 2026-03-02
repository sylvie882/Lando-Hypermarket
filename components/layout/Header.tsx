'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, ShoppingCart, ChevronDown, X, Home, User, LayoutGrid, ShoppingBag, MapPin, LogOut, Heart, Package, User as UserIcon,
  MenuIcon, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string | null;
  avatar_url?: string | null;
  role: string;
}

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<string>('Detecting location...');
  const [isLocating, setIsLocating] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  
  // Scroll state for categories
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(true);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      // Try to get full profile data
      const response = await api.user.getProfile();
      if (response.data && response.data.user) {
        setProfile(response.data.user);
      } else {
        // Fallback to auth user
        setProfile({
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          avatar: user.avatar || null,
          role: user.role || 'customer',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to auth user
      setProfile({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || null,
        role: user.role || 'customer',
      });
    }
  }, [isAuthenticated, user]);

  

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
    fetchUserProfile();
  }, [fetchCartCount, fetchUserProfile]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    // Custom event for profile updates
    window.addEventListener('profile:updated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profile:updated', handleProfileUpdate);
    };
  }, [fetchUserProfile]);

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
        setCategories(uniqueCategories);
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

  // Check scroll position to show/hide buttons
  const checkScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftScroll(scrollLeft > 0);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      // Initial check after categories load
      setTimeout(checkScroll, 100);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [categories, checkScroll]);

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      setAccountMenuOpen(false);
      setProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getAvatarUrl = () => {
    if (avatarError) return '/images/placeholder-avatar.jpeg';
    
    const avatar = profile?.avatar_url || profile?.avatar || user?.avatar;
    
    if (!avatar) return '/images/placeholder-avatar.jpeg';
    
    if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:')) {
      return avatar;
    }
    
    if (avatar.startsWith('avatars/')) {
      return `https://api.hypermarket.co.ke/storage/${avatar}`;
    }
    
    return `https://api.hypermarket.co.ke/storage/${avatar}`;
  };

  const getDisplayName = () => {
    if (profile?.name) return profile.name.split(' ')[0];
    if (user?.name) return user.name.split(' ')[0];
    return 'Account';
  };

  const getFullName = () => {
    if (profile?.name) return profile.name;
    if (user?.name) return user.name;
    return 'User';
  };

  const getEmail = () => {
    if (profile?.email) return profile.email;
    if (user?.email) return user.email;
    return '';
  };

  return (
    <>
      {/* Sticky Header - No animations */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        {/* Top Header */}
        <div className="bg-white text-gray-700 border-b border-gray-100">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center space-x-4">
                <span className="flex items-center px-3 py-1 border border-[#E67E22] rounded">
                  <img src="/images/schedule.png" alt="Scheduled" className="w-4 h-4 sm:w-5 sm:h-5 object-contain mr-1.5" />
                  <span className="text-xs sm:text-sm text-[#E67E22] font-medium">Scheduled</span>
                </span>
                <span className="flex items-center px-3 py-1 border border-[#E67E22] rounded">
                  <img src="/images/express.png" alt="Express" className="w-4 h-4 sm:w-5 sm:h-5 object-contain mr-1.5" />
                  <span className="text-xs sm:text-sm text-[#E67E22] font-medium">Express</span>
                </span>
              </div>
              <div className="hidden md:flex items-center">
                <span className="text-sm text-gray-700">+254 716 354 589</span>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block bg-white">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex items-center justify-between py-3">
              {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 ml-[-30px]">
              <Image 
                src="/logo10.png" 
                alt="Lando Logo" 
                width={200} 
                height={60} 
                className="object-cover w-[190px] h-[70px]"
                priority
              />
            </Link>
              
              {/* Location */}
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

              {/* Search */}
              <form onSubmit={handleSearch} className="flex flex-1 mx-4 max-w-xl">
                <input
                  type="search"
                  placeholder="50,000+ items"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white"
                />
                <button type="submit" className="bg-emerald-500 text-white px-4 rounded-r-lg hover:bg-[#D35400] transition-colors">
                  <Search size={20} />
                </button>
              </form>

              {/* Account */}
              {isAuthenticated && (user || profile) ? (
                <div className="relative">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-[#E67E22] transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden">
                      {getAvatarUrl() ? (
                        <img
                          src={getAvatarUrl()}
                          alt={getDisplayName()}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <User size={16} className="text-white" />
                      )}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium group-hover:text-[#E67E22]">{getDisplayName()}</span>
                      <span className="text-xs text-gray-500">My Account</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${accountMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account Dropdown */}
                  {accountMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                        <div className="bg-[#E6F3E6] p-4 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-full bg-[#E67E22] flex items-center justify-center overflow-hidden">
                              {getAvatarUrl() ? (
                                <img
                                  src={getAvatarUrl()}
                                  alt={getFullName()}
                                  className="w-full h-full object-cover"
                                  onError={() => setAvatarError(true)}
                                />
                              ) : (
                                <User size={20} className="text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{getFullName()}</p>
                              <p className="text-xs text-gray-600 truncate">{getEmail()}</p>
                            </div>
                          </div>
                        </div>
                        
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
                    className="text-sm font-medium text-[#E67E22] hover:text-[#D35400] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    Login
                  </Link>
                  <span className="text-gray-400">|</span>
                  <Link
                    href="/auth/register"
                    className="text-sm font-medium text-[#E67E22] hover:text-[#D35400] transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative ml-2">
                <ShoppingBag size={48} className="text-emerald-500" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#E67E22] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-white">
          <div className="px-4 sm:px-6">
            <div className="py-3">
              <div className="flex items-center justify-between mb-3">
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
                
                <div className="flex items-center space-x-3">
                  {/* Cart Icon - Moved to top */}
                  <Link href="/cart" className="relative">
                    <ShoppingCart size={22} className="text-emerald-500" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#E67E22] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>

                  <button 
                    onClick={getLocation}
                    className="flex items-center space-x-1 text-gray-700 hover:text-[#E67E22] transition-colors"
                  >
                    <MapPin size={16} className="text-[#E67E22]" />
                    <span className="text-xs font-medium truncate max-w-[100px]">
                      {isLocating ? 'Detecting...' : location}
                    </span>
                    <ChevronDown size={12} className="text-gray-500" />
                  </button>
                </div>
              </div>
              
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
                
                <Link 
                  href={isAuthenticated ? "/profile" : "/auth/login"} 
                  className="p-2 bg-white rounded-lg border border-gray-300"
                >
                  <User size={18} className="text-[#E67E22]" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Categories with Scroll Buttons */}
        <nav className="bg-white hidden md:block border-t border-gray-100">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex items-center py-2 relative">
              <button
                className="flex items-center px-3 py-2 text-[#E67E22] hover:bg-gray-50 rounded-md transition-colors border border-[#E67E22]/30 flex-shrink-0"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <MenuIcon size={18} />
                <span className="ml-2 text-sm font-medium">Categories</span>
                <ChevronDown size={16} className="ml-1" />
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-3 flex-shrink-0"></div>
              
              {/* Categories Scroll Container */}
              <div className="relative flex-1 overflow-hidden">
                {/* Left Scroll Button */}
                {showLeftScroll && (
                  <button
                    onClick={scrollLeft}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-emerald-600 shadow-md rounded-full p-1.5 hover:bg-gray-100 transition-colors border border-gray-200"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={18} className="text-white" />
                  </button>
                )}
                
                {/* Scrollable Categories */}
                <div
                  ref={scrollContainerRef}
                  className="flex items-center space-x-4 overflow-x-auto hide-scrollbar scroll-smooth"
                  style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    paddingLeft: showLeftScroll ? '32px' : '0',
                    paddingRight: showRightScroll ? '32px' : '0',
                  }}
                >
                  {categories.map((category) => (
                    <a 
                      key={category.id} 
                      href={`https://hypermarket.co.ke/categories/${category.slug}`}
                      className="text-gray-700 hover:text-[#E67E22] whitespace-nowrap text-sm font-medium transition-colors py-2 flex-shrink-0"
                    >
                      {category.name}
                    </a>
                  ))}
                </div>

                {/* Right Scroll Button */}
                {showRightScroll && (
                  <button
                    onClick={scrollRight}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-emerald-600 shadow-md rounded-full p-1.5 hover:bg-gray-100 transition-colors border border-gray-200"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={18} className="text-white" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation - Removed Cart from here */}
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
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
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

      {/* Desktop Categories Dropdown */}
      {mobileMenuOpen && (
        <div className="hidden md:block absolute z-[60] mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[240px]" style={{ left: 'calc(1rem + 16px)' }}>
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-[#E67E22] uppercase tracking-wider border-b border-gray-100">
              Categories
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

      {/* Global Styles */}
      <style jsx global>{`
        @media (max-width: 768px) {
          body {
            padding-bottom: 60px;
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