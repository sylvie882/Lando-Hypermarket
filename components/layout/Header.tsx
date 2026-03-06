'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, ShoppingCart, ChevronDown, X, Home, User, LayoutGrid, Tag, ShoppingBag, MapPin, LogOut, Heart, Package, User as UserIcon,
  MenuIcon, ChevronLeft, ChevronRight, LogIn, UserPlus, Truck
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import debounce from 'lodash/debounce';

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

interface SearchSuggestion {
  id: number;
  name: string;
  sku: string;
  price: string | number;
  thumbnail: string | null;
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
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  
  // Search autocomplete state
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Scroll state for the entire navigation bar
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

  // Fetch categories from API only
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.categories.getAll();
        const data = response.data || [];
        // Filter only active categories
        const activeCategories = data.filter((category: Category) => category.is_active !== false);
        setCategories(activeCategories);
        console.log('Categories loaded from API:', activeCategories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Set empty array if API fails
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Check scroll position to show/hide buttons for the entire navigation bar
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

  // Scroll functions for the entire navigation bar
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

  // Search autocomplete function with better error handling
  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    
    try {
      console.log('Fetching suggestions for query:', query);
      const response = await api.products.searchAutocomplete(query);
      console.log('Search autocomplete response:', response);
      
      // Handle different response structures
      let suggestionsData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          suggestionsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          suggestionsData = response.data.data;
        } else if (typeof response.data === 'object') {
          // If it's an object but not an array, check if it has a data property
          suggestionsData = response.data.data || [];
        }
      }
      
      console.log('Processed suggestions:', suggestionsData);
      setSuggestions(suggestionsData);
      
      // Show suggestions only if we have results
      setShowSuggestions(suggestionsData.length > 0);
      
    } catch (error: any) {
      console.error('Error fetching search suggestions:', error);
      setSearchError(error?.message || 'Failed to load suggestions');
      setSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      fetchSuggestions(query);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setShowSuggestions(true);
      debouncedSearch(query);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchError(null);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (product: SearchSuggestion) => {
    router.push(`/products/${product.id}`);
    setSearchQuery('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getProductImageUrl = (thumbnail: string | null) => {
    if (!thumbnail) return '/images/placeholder.jpg';
    
    // Use the api's getImageUrl method
    return api.getImageUrl(thumbnail, '/images/placeholder.jpg');
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
      setAccountMenuOpen(false);
      setMobileAccountMenuOpen(false);
      setProfile(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getAvatarUrl = () => {
    if (avatarError) return '/images/avatar.jpeg';
    
    const avatar = profile?.avatar_url || profile?.avatar || user?.avatar;
    
    if (!avatar) return '/images/avatar.jpeg';
    
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
                  <span className="text-xs sm:text-sm text-emerald-500 font-medium">Scheduled</span>
                </span>
                <span className="flex items-center px-3 py-1 border border-[#E67E22] rounded">
                  <img src="/images/express.png" alt="Express" className="w-4 h-4 sm:w-5 sm:h-5 object-contain mr-1.5" />
                  <span className="text-xs sm:text-sm text-emerald-500 font-medium">Express</span>
                </span>
                
                {/* Free Delivery Banner */}
                <span className="hidden md:flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                  <Truck size={16} className="mr-1.5 text-emerald-600" />
                  <span className="text-xs sm:text-sm font-medium">Free delivery for all orders</span>
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

              {/* Search with Autocomplete */}
              <div className="flex flex-1 mx-4 max-w-xl relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="search"
                      placeholder="50,000+ items"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (suggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E67E22] bg-white pr-12"
                    />
                    <button 
                      type="submit" 
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500 text-white px-4 rounded-r-lg hover:bg-[#D35400] transition-colors"
                    >
                      <Search size={20} />
                    </button>
                  </div>
                </form>

                {/* Search Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                    {searchLoading ? (
                      <div className="px-4 py-6 text-gray-500 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E67E22] mb-2"></div>
                        <p className="text-sm">Searching products...</p>
                      </div>
                    ) : searchError ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-red-500 text-sm mb-2">{searchError}</p>
                        <button
                          onClick={() => fetchSuggestions(searchQuery)}
                          className="text-sm text-[#E67E22] hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <p className="text-sm">No products found for "{searchQuery}"</p>
                        <button
                          onClick={handleSearchSubmit}
                          className="mt-2 text-sm text-[#E67E22] hover:underline"
                        >
                          Search all products
                        </button>
                      </div>
                    ) : (
                      <>
                        {suggestions.map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
                          >
                            {/* Product Image */}
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getProductImageUrl(product.thumbnail)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                }}
                              />
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                SKU: {product.sku}
                              </p>
                              <p className="text-sm font-semibold text-[#E67E22]">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </button>
                        ))}
                        
                        {/* View all results link */}
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full px-4 py-3 text-sm text-center text-[#E67E22] hover:bg-orange-50 font-medium border-t border-gray-200"
                        >
                          View all {suggestions.length}+ results for "{searchQuery}"
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

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
          <div className="px-3">
            {/* First Row: Logo + Location + Cart */}
            <div className="flex items-center justify-between py-2">
              <Link href="/" className="inline-block -ml-3">
                <Image 
                  src="/logo10.png" 
                  alt="Lando Logo" 
                  width={130} 
                  height={45} 
                  className="object-cover w-[130px] h-[45px]"
                  priority
                />
              </Link>
              
              <div className="flex items-center space-x-2">
                {/* Location with shorter text */}
                <button 
                  onClick={getLocation}
                  className="flex items-center space-x-0.5 text-gray-700 bg-gray-50 px-2 py-1 rounded-full border border-gray-200"
                >
                  <MapPin size={14} className="text-[#E67E22]" />
                  <span className="text-xs font-medium truncate max-w-[80px]">
                    {isLocating ? '...' : location.length > 8 ? location.substring(0, 8) + '...' : location}
                  </span>
                  <ChevronDown size={10} className="text-gray-500" />
                </button>

                {/* Cart Icon */}
                <Link href="/cart" className="relative p-1.5">
                  <ShoppingCart size={20} className="text-emerald-500" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#E67E22] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-md">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
            
            {/* Second Row: Search + Auth Buttons */}
            <div className="flex items-center space-x-2 pb-3">
              {/* Search Bar - Compact with autocomplete */}
              <div className="flex flex-1 relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search 50k+ items..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (suggestions.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#E67E22] text-sm bg-white pr-10"
                    />
                    <button 
                      type="submit" 
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500 text-white px-2 rounded-r-lg hover:bg-[#D35400] transition-colors"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                </form>

                {/* Mobile Search Suggestions */}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    {searchLoading ? (
                      <div className="px-4 py-4 text-gray-500 flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E67E22] mb-2"></div>
                        <p className="text-xs">Searching...</p>
                      </div>
                    ) : searchError ? (
                      <div className="px-4 py-4 text-center">
                        <p className="text-red-500 text-xs mb-2">{searchError}</p>
                        <button
                          onClick={() => fetchSuggestions(searchQuery)}
                          className="text-xs text-[#E67E22]"
                        >
                          Try again
                        </button>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-4 py-4 text-center text-gray-500">
                        <p className="text-xs">No products found</p>
                      </div>
                    ) : (
                      <>
                        {suggestions.slice(0, 5).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => handleSuggestionClick(product)}
                            className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
                          >
                            {/* Product Image */}
                            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getProductImageUrl(product.thumbnail)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                }}
                              />
                            </div>
                            
                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-xs font-semibold text-[#E67E22]">
                                {formatPrice(product.price)}
                              </p>
                            </div>
                          </button>
                        ))}
                        
                        {/* View all results link */}
                        <button
                          onClick={handleSearchSubmit}
                          className="w-full px-3 py-2 text-xs text-center text-[#E67E22] hover:bg-orange-50 font-medium border-t border-gray-200"
                        >
                          View all results
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Auth Buttons for Non-Authenticated Users */}
              {!isAuthenticated ? (
                <div className="flex items-center space-x-1">
                  <Link 
                    href="/auth/login" 
                    className="flex items-center px-2 py-2 bg-emerald-500 text-white rounded-lg hover:bg-[#D35400] transition-colors"
                    title="Login"
                  >
                    <LogIn size={16} />
                    <span className="ml-1 text-xs font-medium hidden sm:inline">Login</span>
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="flex items-center px-2 py-2 bg-[#E67E22] text-white rounded-lg hover:bg-[#D35400] transition-colors"
                    title="Register"
                  >
                    <UserPlus size={16} />
                    <span className="ml-1 text-xs font-medium hidden sm:inline">Register</span>
                  </Link>
                </div>
              ) : (
                /* Profile Button for Authenticated Users */
                <button 
                  onClick={() => setMobileAccountMenuOpen(!mobileAccountMenuOpen)}
                  className="relative p-1.5 bg-emerald-500 rounded-lg flex items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {getAvatarUrl() ? (
                      <img
                        src={getAvatarUrl()}
                        alt={getDisplayName()}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <User size={14} className="text-emerald-500" />
                    )}
                  </div>
                </button>
              )}
            </div>
            
            {/* Mobile Free Delivery Banner */}
            <div className="flex items-center justify-center py-2 border-t border-gray-100 mt-1">
              <span className="flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                <Truck size={14} className="mr-1.5 text-emerald-600" />
                <span className="text-xs font-medium">Free delivery for all orders</span>
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Categories - Scrollable with always visible < > buttons and proper spacing */}
        <nav className="bg-white hidden md:block border-t border-gray-100">
          <div className="px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex items-center py-3 relative">
              {/* Left Scroll Button - Extra large, no background, with spacing */}
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hover:text-[#E67E22] transition-colors"
                aria-label="Scroll left"
                style={{ left: '-5px' }}
              >
                <ChevronLeft size={36} className="text-gray-600" />
              </button>
              
              {/* Spacer to prevent content from going under left button */}
              <div className="w-12 flex-shrink-0"></div>
              
              {/* Scrollable Navigation Items */}
              <div
                ref={scrollContainerRef}
                className="flex items-center space-x-8 overflow-x-auto hide-scrollbar scroll-smooth w-full"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {/* Home Link */}
                <Link 
                  href="/" 
                  className="flex items-center text-gray-700 hover:text-[#E67E22] font-medium whitespace-nowrap flex-shrink-0"
                >
                  <Home size={20} className="mr-2" />
                  <span>Home</span>
                </Link>
                
                {/* Categories from API with increased spacing */}
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Link 
                      key={category.id} 
                      href={`/categories/${category.slug}`}
                      className="text-gray-700 hover:text-[#E67E22] whitespace-nowrap text-md font-medium transition-colors py-2 flex-shrink-0"
                    >
                      {category.name}
                    </Link>
                  ))
                ) : (
                  // Show loading skeleton or empty state
                  <div className="text-gray-500 py-2 whitespace-nowrap flex-shrink-0">Loading categories...</div>
                )}
              </div>

              {/* Spacer to prevent content from going under right button */}
              <div className="w-12 flex-shrink-0"></div>

              {/* Right Scroll Button - Extra large, no background, with spacing */}
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hover:text-[#E67E22] transition-colors"
                aria-label="Scroll right"
                style={{ right: '-5px' }}
              >
                <ChevronRight size={36} className="text-gray-600" />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Account Menu Drawer for Authenticated Users */}
      {mobileAccountMenuOpen && isAuthenticated && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setMobileAccountMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#E67E22]">My Account</h2>
                <button onClick={() => setMobileAccountMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              {/* User Info */}
              <div className="bg-[#E6F3E6] p-4 rounded-lg mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-full bg-[#E67E22] flex items-center justify-center overflow-hidden">
                    {getAvatarUrl() ? (
                      <img
                        src={getAvatarUrl()}
                        alt={getFullName()}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <User size={24} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{getFullName()}</p>
                    <p className="text-xs text-gray-600 truncate">{getEmail()}</p>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="space-y-1">
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] rounded-lg transition-colors"
                  onClick={() => setMobileAccountMenuOpen(false)}
                >
                  <UserIcon size={18} className="mr-3 text-gray-500" />
                  <span className="font-medium">My Profile</span>
                </Link>
                <Link
                  href="/orders"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] rounded-lg transition-colors"
                  onClick={() => setMobileAccountMenuOpen(false)}
                >
                  <Package size={18} className="mr-3 text-gray-500" />
                  <span className="font-medium">My Orders</span>
                </Link>
                <Link
                  href="/wishlist"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-[#E6F3E6] hover:text-[#E67E22] rounded-lg transition-colors"
                  onClick={() => setMobileAccountMenuOpen(false)}
                >
                  <Heart size={18} className="mr-3 text-gray-500" />
                  <span className="font-medium">Wishlist</span>
                </Link>
                <div className="border-t border-gray-200 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={18} className="mr-3" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
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

          <Link href="/deals" className="flex flex-col items-center p-1 w-16">
            <Tag size={20} className={pathname === '/deals' ? 'text-[#E67E22]' : 'text-gray-600'} />
            <span className={`text-[10px] mt-0.5 ${pathname === '/deals' ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Hot Deals</span>
          </Link>
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center p-1 w-16"
          >
            <LayoutGrid size={20} className={mobileMenuOpen ? 'text-[#E67E22]' : 'text-gray-600'} />
            <span className={`text-[10px] mt-0.5 ${mobileMenuOpen ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Categories</span>
          </button>
          
          {isAuthenticated ? (
            <button 
              onClick={() => setMobileAccountMenuOpen(true)}
              className="flex flex-col items-center p-1 w-16"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center overflow-hidden">
                {getAvatarUrl() ? (
                  <img
                    src={getAvatarUrl()}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <User size={12} className="text-white" />
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${pathname === '/profile' ? 'text-[#E67E22] font-medium' : 'text-gray-600'}`}>Profile</span>
            </button>
          ) : (
            <Link href="/auth/login" className="flex flex-col items-center p-1 w-16">
              <User size={20} className="text-gray-600" />
              <span className="text-[10px] mt-0.5 text-gray-600">Login</span>
            </Link>
          )}
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
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <Link 
                      key={category.id} 
                      href={`/categories/${category.slug}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-700 hover:text-[#E67E22] hover:bg-[#E6F3E6] px-4 py-3 rounded-md text-base font-medium transition-colors border-b border-gray-100 last:border-0"
                    >
                      {category.name}
                    </Link>
                  ))
                ) : (
                  <div className="text-gray-500 px-4 py-3">Loading categories...</div>
                )}
              </div>
            </div>
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