'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Search, ShoppingCart, ChevronDown, X, Home, User, LayoutGrid, Tag, ShoppingBag, MapPin, LogOut, Heart, Package, User as UserIcon,
  ChevronLeft, ChevronRight, LogIn, UserPlus, Truck, Flame
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import debounce from 'lodash/debounce';

interface Category { id: number; name: string; slug: string; is_active: boolean; }
interface UserProfile { id: number; name: string; email: string; phone: string; avatar: string | null; avatar_url?: string | null; role: string; }
interface SearchSuggestion { id: number; name: string; price: string | number; thumbnail: string | null; }

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [location, setLocation] = useState<string>('Detecting...');
  const [isLocating, setIsLocating] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    try {
      const response = await api.user.getProfile();
      if (response.data?.user) setProfile(response.data.user);
      else setProfile({ id: user.id, name: user.name||'', email: user.email||'', phone: user.phone||'', avatar: user.avatar||null, role: user.role||'customer' });
    } catch { setProfile({ id: user.id, name: user.name||'', email: user.email||'', phone: user.phone||'', avatar: user.avatar||null, role: user.role||'customer' }); }
  }, [isAuthenticated, user]);

  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated) { setCartCount(0); return; }
    try { const r = await api.cart.getCount(); setCartCount(Number(r.data?.count || r.data || 0)); } catch { setCartCount(0); }
  }, [isAuthenticated]);

  useEffect(() => { fetchCartCount(); fetchUserProfile(); }, [fetchCartCount, fetchUserProfile]);

  const getLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`);
          const d = await r.json();
          setLocation(d.city || d.locality || d.principalSubdivision || 'Unknown');
        } catch { setLocation('Location detected'); }
        setIsLocating(false);
      }, () => { setLocation('Nairobi, Kenya'); setIsLocating(false); });
    } else { setLocation('Nairobi, Kenya'); setIsLocating(false); }
  };

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const r = await api.categories.getAll();
        setCategories((r.data || []).filter((c: Category) => c.is_active !== false));
      } catch { setCategories([]); }
    };
    fetchCategories();
  }, []);

  const checkScroll = useCallback(() => {}, []);
  const scrollLeft = () => scrollContainerRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => scrollContainerRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
    setSearchLoading(true); setSearchError(null);
    try {
      const r = await fetch(`https://api.hypermarket.co.ke/api/products/search?query=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const data = Array.isArray(d) ? d : (d.data && Array.isArray(d.data) ? d.data : []);
      setSuggestions(data); setShowSuggestions(data.length > 0);
    } catch (e: any) { setSearchError(e?.message||'Failed'); setSuggestions([]); }
    finally { setSearchLoading(false); }
  };

  const debouncedSearch = useCallback(debounce((q: string) => fetchSuggestions(q), 300), []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value; setSearchQuery(q);
    if (q.length >= 2) { setShowSuggestions(true); debouncedSearch(q); }
    else { setSuggestions([]); setShowSuggestions(false); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) { router.push(`/products?search=${encodeURIComponent(searchQuery)}`); setSearchQuery(''); setShowSuggestions(false); }
  };

  const handleSuggestionClick = (product: SearchSuggestion) => {
    if (isNavigating) return; setIsNavigating(true);
    setShowSuggestions(false); setSearchQuery('');
    router.push(`/products/${product.id}`);
    setTimeout(() => { setSuggestions([]); setIsNavigating(false); }, 500);
  };

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const getProductImageUrl = (t: string | null) => t ? api.getImageUrl(t, '/images/placeholder.jpg') : '/images/placeholder.jpg';
  const formatPrice = (p: string | number) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(typeof p === 'string' ? parseFloat(p) : p);
  const handleLogout = async () => { try { await logout(); router.push('/'); setAccountMenuOpen(false); setMobileAccountMenuOpen(false); setProfile(null); } catch {} };
  const getAvatarUrl = () => {
    if (avatarError) return '/images/avatar.jpeg';
    const a = profile?.avatar_url || profile?.avatar || user?.avatar;
    if (!a) return '/images/avatar.jpeg';
    if (a.startsWith('http')||a.startsWith('data:')) return a;
    return `https://api.hypermarket.co.ke/storage/${a}`;
  };
  const getDisplayName = () => (profile?.name || user?.name || 'Account').split(' ')[0];
  const getFullName = () => profile?.name || user?.name || 'User';
  const getEmail = () => profile?.email || user?.email || '';

  return (
    <>
      <header className={`sticky top-0 z-50 bg-white transition-all duration-300 ${isScrolled ? 'shadow-xl shadow-black/5' : 'shadow-sm'}`} role="banner">
        
        {/* PROMO BAR */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white text-xs">
          <div className="w-full px-4 sm:px-6 lg:px-12 flex items-center justify-between py-1.5">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-medium"><Truck size={13}/> Free delivery on all orders</span>
              <span className="hidden sm:flex items-center gap-1.5 border-l border-white/25 pl-4"><Flame size={13} className="text-amber-300"/> Hot deals every day</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:block opacity-80">📞 +254 716 354 589</span>
              <span className="bg-white/20 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <img src="/images/schedule.png" alt="" className="w-3 h-3 object-contain" aria-hidden="true"/> Scheduled
              </span>
              <span className="bg-white/20 rounded-full px-2.5 py-0.5 flex items-center gap-1">
                <img src="/images/express.png" alt="" className="w-3 h-3 object-contain" aria-hidden="true"/> Express
              </span>
            </div>
          </div>
        </div>

        {/* DESKTOP MAIN BAR */}
        <div className="hidden md:block bg-white border-b border-gray-100/80">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="flex items-center gap-5 py-3.5">
              
              {/* Logo */}
              <Link href="/" className="flex-shrink-0 -ml-2" aria-label="Lando Ranch – Home">
                <Image src="/logo10.png" alt="Lando Ranch Hypermarket – Online Grocery Kenya" width={220} height={80} className="object-cover w-[170px] h-[62px]" priority />
              </Link>

              {/* Location */}
              <button onClick={getLocation} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors group flex-shrink-0 py-2 px-3 rounded-xl hover:bg-emerald-50" aria-label="Set delivery location">
                <div className="w-8 h-8 rounded-full bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <MapPin size={15} className="text-emerald-600" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-gray-400 leading-none mb-0.5">Deliver to</div>
                  <div className="flex items-center gap-0.5">
                    <span className="text-xs font-semibold text-gray-800 max-w-[80px] truncate">{isLocating ? 'Detecting…' : location}</span>
                    <ChevronDown size={11} className="text-gray-400"/>
                  </div>
                </div>
              </button>

              {/* Search */}
              <div className="flex-1 max-w-2xl relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} role="search" aria-label="Search products">
                  <div className="relative flex">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
                    <input ref={searchInputRef} type="search" placeholder="Search 50,000+ products…" value={searchQuery} onChange={handleSearchChange}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                      className="w-full pl-10 pr-2 py-2.5 border-2 border-gray-200 rounded-l-xl focus:outline-none focus:border-emerald-400 bg-gray-50/80 focus:bg-white text-sm transition-all placeholder-gray-400"
                      autoComplete="off" aria-autocomplete="list" aria-haspopup="listbox" />
                    <button type="submit" className="px-5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-r-xl text-sm font-semibold transition-all flex items-center gap-1.5 border-2 border-emerald-500 flex-shrink-0">
                      <Search size={15} /> Search
                    </button>
                  </div>
                </form>

                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[9999] overflow-hidden" role="listbox">
                    {searchLoading ? (
                      <div className="px-5 py-8 flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                        <p className="text-sm text-gray-500">Searching…</p>
                      </div>
                    ) : searchError ? (
                      <div className="px-5 py-5 text-center">
                        <p className="text-red-500 text-sm mb-2">{searchError}</p>
                        <button onClick={() => fetchSuggestions(searchQuery)} className="text-sm text-emerald-600 hover:underline">Retry</button>
                      </div>
                    ) : suggestions.length === 0 ? (
                      <div className="px-5 py-5 text-center text-sm text-gray-500">No results for "<strong>{searchQuery}</strong>"</div>
                    ) : (
                      <>
                        <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-medium">{suggestions.length} products found</span>
                          <button onClick={handleSearchSubmit} className="text-xs text-emerald-600 font-semibold hover:underline">View all</button>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {suggestions.map(p => (
                            <button key={p.id} onClick={() => handleSuggestionClick(p)} disabled={isNavigating}
                              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0 text-left group/item" role="option">
                              <div className="w-11 h-11 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-gray-200 group-hover/item:ring-emerald-200 transition-all">
                                <img src={getProductImageUrl(p.thumbnail)} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate group-hover/item:text-emerald-700">{p.name}</p>
                                <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatPrice(p.price)}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-300 group-hover/item:text-emerald-400 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                        <button onClick={handleSearchSubmit} className="w-full px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 font-semibold border-t border-gray-100 transition-colors text-center">
                          See all results for "{searchQuery}" →
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Account */}
              {isAuthenticated && (user || profile) ? (
                <div className="relative flex-shrink-0">
                  <button onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-full ring-2 ring-emerald-200 overflow-hidden bg-emerald-100 flex-shrink-0">
                      <img src={getAvatarUrl()} alt={getDisplayName()} className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-[10px] text-gray-400 leading-none mb-0.5">Hello, {getDisplayName()}</p>
                      <p className="text-xs font-bold text-gray-800">My Account</p>
                    </div>
                    <ChevronDown size={13} className={`text-gray-400 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`}/>
                  </button>
                  {accountMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full ring-2 ring-white/40 overflow-hidden"><img src={getAvatarUrl()} alt={getFullName()} className="w-full h-full object-cover" onError={() => setAvatarError(true)} /></div>
                            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-white truncate">{getFullName()}</p><p className="text-xs text-white/70 truncate">{getEmail()}</p></div>
                          </div>
                        </div>
                        <div className="p-1.5">
                          {[{href:'/profile',icon:UserIcon,label:'My Profile'},{href:'/orders',icon:Package,label:'My Orders'},{href:'/profile/wishlist',icon:Heart,label:'Wishlist'}].map(item=>(
                            <Link key={item.href} href={item.href} onClick={() => setAccountMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-colors">
                              <item.icon size={15} className="text-gray-400"/> {item.label}
                            </Link>
                          ))}
                          <div className="border-t border-gray-100 my-1.5"/>
                          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                            <LogOut size={15}/> Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href="/auth/login" className="text-sm font-semibold text-gray-700 hover:text-emerald-600 px-4 py-2 rounded-xl border border-gray-200 hover:border-emerald-200 transition-all">Sign In</Link>
                  <Link href="/auth/register" className="text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-4 py-2 rounded-xl transition-all shadow-sm">Register</Link>
                </div>
              )}

              {/* Cart */}
              <Link href="/cart" className="relative flex-shrink-0 p-2.5 rounded-xl hover:bg-gray-50 transition-colors group" aria-label={`Cart${cartCount > 0 ? ` (${cartCount})` : ''}`}>
                <ShoppingBag size={24} className="text-gray-700 group-hover:text-emerald-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-br from-orange-400 to-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center shadow-md px-1">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* DESKTOP CATEGORIES */}
        <nav className="bg-white hidden md:block border-b border-gray-100" aria-label="Product categories">
          <div className="w-full px-4 sm:px-6 lg:px-12">
            <div className="flex items-center py-2 relative">
              <button onClick={scrollLeft} className="absolute -left-1 z-20 p-1 text-gray-400 hover:text-emerald-600 transition-colors" aria-label="Scroll left"><ChevronLeft size={26}/></button>
              <div className="w-6 flex-shrink-0"/>
              <div ref={scrollContainerRef} className="flex items-center gap-0.5 overflow-x-auto scroll-smooth w-full" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
                <Link href="/" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${pathname==='/'?'bg-emerald-100 text-emerald-700':'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                  <Home size={14}/> Home
                </Link>
                <Link href="/products" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${pathname==='/products'?'bg-emerald-100 text-emerald-700':'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                  <ShoppingBag size={14}/> All Products
                </Link>
                <Link href="/deals" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap flex-shrink-0 text-orange-600 hover:bg-orange-50 transition-all">
                  <Flame size={14}/> Hot Deals
                </Link>
                <div className="w-px h-4 bg-gray-200 flex-shrink-0 mx-1"/>
                {categories.length > 0 ? categories.map(c => (
                  <Link key={c.id} href={`/categories/${c.slug}`}
                    className={`text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-all ${pathname===`/categories/${c.slug}`?'bg-emerald-100 text-emerald-700':'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                    {c.name}
                  </Link>
                )) : [1,2,3,4,5].map(i=><div key={i} className="w-20 h-7 bg-gray-100 rounded-lg animate-pulse flex-shrink-0"/>)}
              </div>
              <div className="w-6 flex-shrink-0"/>
              <button onClick={scrollRight} className="absolute -right-1 z-20 p-1 text-gray-400 hover:text-emerald-600 transition-colors" aria-label="Scroll right"><ChevronRight size={26}/></button>
            </div>
          </div>
        </nav>

        {/* MOBILE HEADER */}
        <div className="md:hidden bg-white">
          <div className="px-3 pt-2 pb-2">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" aria-label="Lando Ranch">
                <Image src="/logo10.png" alt="Lando Ranch" width={130} height={45} className="w-[115px] h-[40px] object-cover" priority />
              </Link>
              <div className="flex items-center gap-2">
                <button onClick={getLocation} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1.5">
                  <MapPin size={11} className="text-emerald-500 flex-shrink-0"/>
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[65px]">{isLocating?'…':location.length>8?location.substring(0,8)+'…':location}</span>
                  <ChevronDown size={10} className="text-gray-400"/>
                </button>
                <Link href="/cart" className="relative p-1.5" aria-label={`Cart (${cartCount})`}>
                  <ShoppingCart size={22} className="text-gray-700"/>
                  {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cartCount}</span>}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative" ref={searchRef}>
                <form onSubmit={handleSearchSubmit} role="search">
                  <div className="relative flex">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                    <input type="search" placeholder="Search 50k+ products…" value={searchQuery} onChange={handleSearchChange}
                      onFocus={() => { if (suggestions.length>0) setShowSuggestions(true); }}
                      className="w-full pl-8 pr-2 py-2 border border-gray-200 rounded-l-xl text-xs focus:outline-none focus:border-emerald-400 bg-gray-50 transition-all" autoComplete="off" />
                    <button type="submit" className="px-3 bg-emerald-500 text-white rounded-r-xl flex-shrink-0"><Search size={14}/></button>
                  </div>
                </form>
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[9999] max-h-64 overflow-y-auto">
                    {searchLoading ? <div className="p-4 flex items-center justify-center gap-2"><div className="w-5 h-5 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin"/><p className="text-xs text-gray-500">Searching…</p></div>
                    : suggestions.length === 0 ? <div className="p-4 text-center text-xs text-gray-500">No results</div>
                    : <>
                      {suggestions.slice(0,5).map(p=>(
                        <button key={p.id} onClick={() => handleSuggestionClick(p)} disabled={isNavigating}
                          className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-emerald-50 transition-colors border-b border-gray-50 last:border-0 text-left">
                          <div className="w-9 h-9 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={getProductImageUrl(p.thumbnail)} alt={p.name} className="w-full h-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).src='/images/placeholder.jpg';}}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs font-bold text-emerald-600">{formatPrice(p.price)}</p>
                          </div>
                        </button>
                      ))}
                      <button onClick={handleSearchSubmit} className="w-full px-3 py-2.5 text-xs text-center text-emerald-600 font-semibold border-t border-gray-100 hover:bg-emerald-50">View all →</button>
                    </>}
                  </div>
                )}
              </div>
              {!isAuthenticated ? (
                <Link href="/auth/login" className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold">
                  <LogIn size={13}/> <span className="hidden sm:inline">Login</span>
                </Link>
              ) : (
                <button onClick={() => setMobileAccountMenuOpen(!mobileAccountMenuOpen)} className="flex-shrink-0 w-9 h-9 rounded-full ring-2 ring-emerald-200 overflow-hidden bg-emerald-100">
                  <img src={getAvatarUrl()} alt={getDisplayName()} className="w-full h-full object-cover" onError={() => setAvatarError(true)}/>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Account Drawer */}
      {mobileAccountMenuOpen && isAuthenticated && (
        <div className="fixed inset-0 z-[70] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileAccountMenuOpen(false)}/>
          <div className="absolute right-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 pt-8 relative">
              <button onClick={() => setMobileAccountMenuOpen(false)} className="absolute top-4 right-4 w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-white"><X size={14}/></button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full ring-2 ring-white/40 overflow-hidden"><img src={getAvatarUrl()} alt={getFullName()} className="w-full h-full object-cover" onError={() => setAvatarError(true)}/></div>
                <div><p className="font-bold text-white">{getFullName()}</p><p className="text-xs text-white/70">{getEmail()}</p></div>
              </div>
            </div>
            <div className="p-4 space-y-1">
              {[{href:'/profile',icon:UserIcon,label:'My Profile'},{href:'/orders',icon:Package,label:'My Orders'},{href:'/profile/wishlist',icon:Heart,label:'Wishlist'}].map(item=>(
                <Link key={item.href} href={item.href} onClick={() => setMobileAccountMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition-colors">
                  <item.icon size={18} className="text-gray-400"/> {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-2"/>
              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium transition-colors">
                <LogOut size={18}/> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Categories Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}/>
          <div className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-900">All Categories</h2>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-full"><X size={18}/></button>
              </div>
              <div className="space-y-0.5">
                {categories.length > 0 ? categories.map(c=>(
                  <Link key={c.id} href={`/categories/${c.slug}`} onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    {c.name} <ChevronRight size={14} className="text-gray-300"/>
                  </Link>
                )) : <div className="text-gray-400 px-4 py-3 text-sm">Loading…</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50" aria-label="Main navigation">
        <div className="flex justify-around items-center py-2 pb-safe">
          {[{href:'/',icon:Home,label:'Home'},{href:'/products',icon:ShoppingBag,label:'Shop'},{href:'/deals',icon:Flame,label:'Deals',accent:true}].map(item=>(
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${pathname===item.href?'text-emerald-600':item.accent?'text-orange-500':'text-gray-500'}`}>
              <item.icon size={20}/> <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          ))}
          <button onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${mobileMenuOpen?'text-emerald-600':'text-gray-500'}`}>
            <LayoutGrid size={20}/> <span className="text-[10px] mt-0.5 font-medium">Categories</span>
          </button>
          {isAuthenticated ? (
            <button onClick={() => setMobileAccountMenuOpen(true)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${pathname==='/profile'?'text-emerald-600':'text-gray-500'}`}>
              <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-gray-200 mb-0.5">
                <img src={getAvatarUrl()} alt="Profile" className="w-full h-full object-cover" onError={() => setAvatarError(true)}/>
              </div>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          ) : (
            <Link href="/auth/login" className="flex flex-col items-center py-1 px-3 text-gray-500">
              <User size={20}/> <span className="text-[10px] mt-0.5 font-medium">Login</span>
            </Link>
          )}
        </div>
      </nav>

      <style jsx global>{`
        @media (max-width: 768px) { body { padding-bottom: 64px; } }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 8px); }
        [ref="scrollContainerRef"]::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
};

export default Header;
