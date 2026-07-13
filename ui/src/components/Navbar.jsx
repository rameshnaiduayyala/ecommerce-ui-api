import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import FlashAnnouncement from './FlashAnnouncement';
import logoImg from '../assets/logo.png';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Sweets', path: '/products' },
  { label: 'Categories', path: '/categories' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <FlashAnnouncement />

      <header className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-border/60 shadow-sm'
          : 'bg-white border-b border-border/30'
      }`}>
        <div className="container mx-auto px-4 md:px-8 h-[72px] flex items-center justify-between gap-4">

          {/* ── LOGO ── */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm shrink-0">
              <img src={logoImg} alt="Aha Konaseema" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[8px] font-bold tracking-[0.25em] uppercase text-muted-foreground">Since 1948</span>
              <span className="text-base font-serif font-black tracking-tight text-primary group-hover:text-[#85161b] transition-colors">Aha Konaseema</span>
              <span className="text-[7px] tracking-[0.2em] uppercase text-muted-foreground/70 font-medium">Pure Ghee Sweets</span>
            </div>
          </Link>

          {/* ── CENTER NAV (desktop) ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                className={`relative px-4 py-2 text-sm font-bold rounded-full transition-all duration-200 ${
                  isActive(path)
                    ? 'text-primary bg-primary/8'
                    : 'text-[#444] hover:text-primary hover:bg-black/4'
                }`}
              >
                {label}
                {isActive(path) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></span>
                )}
              </Link>
            ))}

            {/* Account Dropdown */}
            <div className="relative group ml-1">
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-[#444] hover:text-primary hover:bg-black/4 rounded-full transition-all duration-200">
                {user ? (
                  <>
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-[9px] font-black flex items-center justify-center shrink-0 shadow-sm">
                      {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                    </span>
                    <span className="hidden xl:inline max-w-[90px] truncate">
                      {user.user_metadata?.full_name
                        ? user.user_metadata.full_name.split(' ')[0]
                        : user.email.split('@')[0]}
                    </span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-50 group-hover:rotate-180 transition-transform duration-200 shrink-0">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* Dropdown */}
              <div className="absolute top-full right-0 pt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                <div className="bg-white border border-border/60 shadow-xl rounded-2xl p-2 flex flex-col gap-0.5 min-w-[190px]">
                  {user ? (
                    <>
                      <div className="px-3 py-2.5 mb-1 border-b border-border/40">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Signed in as</p>
                        <p className="text-xs font-bold text-[#222] truncate mt-0.5">{user.email}</p>
                      </div>
                      <Link to="/profile" className="text-sm font-semibold text-[#333] hover:text-primary hover:bg-black/4 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 opacity-60"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                        My Profile
                      </Link>
                      <Link to="/orders" className="text-sm font-semibold text-[#333] hover:text-primary hover:bg-black/4 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 opacity-60"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                        My Orders
                      </Link>
                      <Link to="/wishlist" className="text-sm font-semibold text-[#333] hover:text-primary hover:bg-black/4 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 opacity-60"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                        Wishlist
                      </Link>
                      {isAdmin && (
                        <Link to="/admin" className="text-sm font-semibold text-primary hover:bg-primary/8 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 border-t border-border/40 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                          Admin Panel
                        </Link>
                      )}
                      <button onClick={signOut} className="text-sm text-left text-red-500 hover:bg-red-50 px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 mt-1 border-t border-border/40 w-full font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link to="/login" className="text-sm font-bold text-white bg-primary hover:bg-black text-center px-4 py-3 rounded-xl transition-all m-1">
                      Login / Register
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* ── RIGHT ICONS ── */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 bg-[#f5f5f5] border border-border rounded-full px-3 py-1.5 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-muted-foreground shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search sweets..."
                  className="bg-transparent text-sm outline-none w-40 md:w-52 font-medium placeholder:text-muted-foreground/60"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#444] hover:text-primary transition-all"
                aria-label="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </button>
            )}

            {/* Wishlist (desktop) */}
            <Link to="/wishlist" className="hidden sm:flex w-9 h-9 items-center justify-center rounded-full hover:bg-black/5 text-[#444] hover:text-primary transition-all" aria-label="Wishlist">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#444] hover:text-primary transition-all" aria-label="Cart">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[9px] font-black min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 text-[#444] hover:text-primary transition-all ml-0.5"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

        </div>
      </header>

      {/* ── MOBILE MENU DRAWER ── */}
      <div className={`fixed inset-0 z-[60] lg:hidden transition-all duration-400 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        <div className={`absolute top-0 right-0 w-[82%] max-w-[340px] h-full bg-white shadow-2xl flex flex-col transition-transform duration-400 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/20">
                <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-serif font-black text-[#222]">Aha Konaseema</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[#444]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="flex flex-col gap-1 px-4 py-5 flex-1 overflow-y-auto">
            {NAV_LINKS.map(({ label, path }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive(path) ? 'bg-primary/8 text-primary' : 'text-[#333] hover:bg-black/4 hover:text-primary'}`}
              >
                {label}
                {isActive(path) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
              </Link>
            ))}

            <div className="border-t border-border/30 mt-2 pt-2">
              {user ? (
                <>
                  <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-4 py-2">My Account</p>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-[#333] hover:bg-black/4 hover:text-primary transition-all">My Profile</Link>
                  <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-[#333] hover:bg-black/4 hover:text-primary transition-all">My Orders</Link>
                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-[#333] hover:bg-black/4 hover:text-primary transition-all">Wishlist</Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-primary hover:bg-primary/8 transition-all">Admin Panel</Link>
                  )}
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all mt-2 border border-red-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="px-2 py-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block w-full bg-primary hover:bg-black text-white text-center py-3.5 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-md">
                    Login / Register
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Drawer Footer */}
          <div className="px-6 py-4 border-t border-border/30 text-center">
            <p className="text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest">© 2026 Aha Konaseema · Since 1948</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
