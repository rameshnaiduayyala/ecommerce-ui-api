import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import { searchProducts } from '../api/catalog';
import logoImg from '../assets/logo.png';

const DEPARTMENTS = [
  { label: 'Traditional Sweets', path: '/categories' },
  { label: 'Hot Savories', path: '/categories' },
  { label: 'Pickles & Powders', path: '/categories' },
  { label: 'Dry Fruits & Nuts', path: '/categories' },
  { label: 'Festival Gift Packs', path: '/categories' },
  { label: 'Healthy Organic Millets', path: '/categories' },
];

const SECONDARY_NAV = [
  { label: 'Departments', hasDrop: true },
  { label: 'Services', hasDrop: false, path: '/categories' },
  { label: 'Rollbacks & More', path: '/products' },
  { label: 'New Arrivals', path: '/products' },
  { label: 'Get it Fast', path: '/products' },
  { label: 'Best Sellers', path: '/products' },
  { label: 'Deals', path: '/products' },
  { label: 'Shop+', path: '/products' },
];

const EnterpriseHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { cartCount, cartTotal, cartItems } = useCart();
  const { countryCode, countryName, symbol, flag, changeCountry, formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const deptRef = useRef(null);

  // Advanced Search suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Fulfillment selector states
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState('shipping');
  const [zipCode, setZipCode] = useState('533001'); // Default Godavari ZIP
  const [zipInput, setZipInput] = useState('');
  const [zipSuccess, setZipSuccess] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDeptOpen(false);
  }, [location]);

  // Load recent searches and fulfillment setup from localStorage
  useEffect(() => {
    try {
      const savedRecent = JSON.parse(localStorage.getItem('wm_recent_searches') || '[]');
      setRecentSearches(savedRecent);

      const savedZip = localStorage.getItem('wm_zip') || '533001';
      const savedType = localStorage.getItem('wm_fulfillment_type') || 'shipping';
      setZipCode(savedZip);
      setFulfillmentType(savedType);
      setZipInput(savedZip);
    } catch {}
  }, []);

  // Close dept dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (deptRef.current && !deptRef.current.contains(e.target)) setDeptOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Search Autocomplete Suggestion Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setSelectedSuggestionIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchProducts(searchQuery.trim(), { take: 5 });
        setSuggestions(results || []);
        setSelectedSuggestionIndex(-1);
      } catch (err) {
        console.error('Search suggestions query error:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard accessibility listeners ('/' to focus, 'Escape' to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== document.querySelector('.wm-search-input')) {
        e.preventDefault();
        document.querySelector('.wm-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setLocationModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      // Save to recent searches
      const updatedRecent = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('wm_recent_searches', JSON.stringify(updatedRecent));

      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchQuery('');
      setSearchFocused(false);
    }
  };

  const handleSuggestionClick = (prod) => {
    const query = prod.name;
    const updatedRecent = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updatedRecent);
    localStorage.setItem('wm_recent_searches', JSON.stringify(updatedRecent));

    navigate(`/products/${prod.id}`);
    setSearchQuery('');
    setSearchFocused(false);
  };

  const handleRecentClick = (term) => {
    setSearchQuery(term);
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setSearchFocused(false);
  };

  const clearRecentSearches = (e) => {
    e.preventDefault(); e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem('wm_recent_searches');
  };

  const handleKeyboardNav = (e) => {
    if (!suggestions.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedSuggestionIndex];
      handleSuggestionClick(selected);
    }
  };

  const handleZipSubmit = (e) => {
    e.preventDefault();
    if (zipInput.trim().length >= 5) {
      setZipCode(zipInput.trim());
      localStorage.setItem('wm_zip', zipInput.trim());
      localStorage.setItem('wm_fulfillment_type', fulfillmentType);
      
      // Dispatch custom event to notify components like product cards to update estimated times
      window.dispatchEvent(new Event('wm-fulfillment-updated'));

      setZipSuccess(true);
      setTimeout(() => {
        setZipSuccess(false);
        setLocationModalOpen(false);
      }, 1000);
    }
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="text-primary bg-transparent font-bold">{part}</mark> 
        : part
    );
  };

  const displayName = user
    ? (user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Account')
    : 'Sign In';

  return (
    <>
      {/* ── TOP NAV HEADER ── */}
      <header className={`sticky top-0 z-50 w-full transition-shadow duration-200 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="wm-header-top bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800">
          <div className="wm-container">
            <div className="wm-top-inner">

              {/* Logo */}
              <Link to="/" className="wm-logo-wrap" aria-label="Home">
                <div className="wm-spark">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="wm-spark-svg animate-pulse-slow">
                    <path d="M16 2L17.8 9.2L24 6L20.8 12.2L28 14L20.8 15.8L24 22L17.8 18.8L16 26L14.2 18.8L8 22L11.2 15.8L4 14L11.2 12.2L8 6L14.2 9.2L16 2Z" fill="#FFC220"/>
                  </svg>
                </div>
                <div className="wm-logo-text">
                  <span className="wm-logo-brand text-amber-400 font-extrabold font-serif">Aha Konaseema</span>
                  <span className="wm-logo-sub text-[8px] text-gray-300">Save money. Eat traditional.</span>
                </div>
              </Link>

              {/* Fulfillment Location Picker Button */}
              <button 
                onClick={() => setLocationModalOpen(true)}
                className="wm-location-btn" 
                aria-label="Change fulfillment location"
              >
                <svg className="wm-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                </svg>
                <div className="wm-location-text">
                  <span className="wm-location-label text-gray-300">
                    {fulfillmentType === 'pickup' ? 'Store Pickup' : fulfillmentType === 'delivery' ? 'Local Delivery' : 'Shipping'}
                  </span>
                  <span className="wm-location-address">ZIP: {zipCode}</span>
                </div>
                <svg className="wm-chevron text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                </svg>
              </button>

              {/* Real-time Country & Currency Selector */}
              <div className="flex items-center shrink-0">
                <select
                  value={countryCode}
                  onChange={e => changeCountry(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white text-xs font-bold rounded-full px-3 py-1.5 focus:outline-none cursor-pointer hover:bg-white/15 transition-all outline-none"
                  aria-label="Select Country"
                >
                  <option value="IN" className="text-black">🇮🇳 India (INR)</option>
                  <option value="US" className="text-black">🇺🇸 USA (USD)</option>
                  <option value="GB" className="text-black">🇬🇧 UK (GBP)</option>
                </select>
              </div>

              {/* Smart Autocomplete Search Bar */}
              <div className="wm-search-wrap" ref={deptRef}>
                <form onSubmit={handleSearchSubmit} className={`wm-search-form ${searchFocused ? 'focused' : ''}`} role="search">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onKeyDown={handleKeyboardNav}
                    placeholder="Search traditional sweets, hot savories, pickles..."
                    className="wm-search-input"
                    aria-label="Search products"
                  />
                  <button type="submit" className="wm-search-btn" aria-label="Search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="wm-search-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                    </svg>
                  </button>
                </form>

                {/* Suggestions Popover Dropdown */}
                {searchFocused && (searchQuery.trim().length > 0 || recentSearches.length > 0) && (
                  <div className="wm-search-suggestions scrollbar-none">
                    {/* Recent Searches Section */}
                    {searchQuery.trim().length === 0 && recentSearches.length > 0 && (
                      <div className="wm-suggestion-section">
                        <div className="wm-suggestion-title flex justify-between items-center">
                          <span>Recent Searches</span>
                          <button onClick={clearRecentSearches} className="wm-recent-clear-btn">Clear All</button>
                        </div>
                        {recentSearches.map((term, index) => (
                          <button 
                            key={index}
                            onClick={() => handleRecentClick(term)}
                            className="wm-suggestion-item"
                          >
                            <span className="wm-suggestion-item-icon">🕒</span>
                            <span className="wm-suggestion-item-text">{term}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Suggestions Section */}
                    {searchQuery.trim().length > 0 && (
                      <div className="wm-suggestion-section">
                        <div className="wm-suggestion-title">Matching Suggestions</div>
                        {suggestions.length > 0 ? (
                          suggestions.map((prod, index) => (
                            <button
                              key={prod.id}
                              onClick={() => handleSuggestionClick(prod)}
                              className={`wm-suggestion-item ${index === selectedSuggestionIndex ? 'keyboard-selected' : ''}`}
                            >
                              {prod.image_url ? (
                                <img src={prod.image_url} alt="" className="wm-suggestion-product-img" />
                              ) : (
                                <span className="wm-suggestion-item-icon">🍭</span>
                              )}
                              <span className="wm-suggestion-item-text">
                                {highlightMatch(prod.name, searchQuery)}
                              </span>
                              <span className="wm-suggestion-product-price">{formatPrice(prod.price)}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-xs text-gray-500 text-center">
                            No sweets or savories found for "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Popular Categories Links */}
                    <div className="wm-suggestion-section mt-1 pt-1 border-t border-gray-100">
                      <div className="wm-suggestion-title">Popular Departments</div>
                      <div className="flex flex-wrap gap-2 p-2">
                        {DEPARTMENTS.slice(0, 4).map(d => (
                          <Link 
                            key={d.label}
                            to={d.path} 
                            onClick={() => setSearchFocused(false)}
                            className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                          >
                            {d.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Side Actions */}
              <div className="wm-right-actions">

                {/* Reorder */}
                <Link to="/orders" className="wm-action-btn hover:bg-white/10" aria-label="Reorder items">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="wm-action-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                  </svg>
                  <div>
                    <span className="wm-action-top text-gray-300">Reorder</span>
                    <span className="wm-action-bold">My Items</span>
                  </div>
                </Link>

                {/* User Account / Profile */}
                <div className="wm-account-wrap group">
                  <button className="wm-action-btn hover:bg-white/10" aria-label="Account">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="wm-action-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                    </svg>
                    <div>
                      <span className="wm-action-top text-gray-300">{user ? 'Welcome back' : 'Sign In'}</span>
                      <span className="wm-action-bold">
                        {user ? displayName : 'Account'}
                      </span>
                    </div>
                  </button>
                  {/* Account Dropdown */}
                  <div className="wm-account-drop">
                    {user ? (
                      <>
                        <div className="wm-drop-header">
                          <p className="wm-drop-email text-primary font-bold">{user.email}</p>
                        </div>
                        <Link to="/profile" className="wm-drop-item">My Profile</Link>
                        <Link to="/orders" className="wm-drop-item">My Orders</Link>
                        <Link to="/wishlist" className="wm-drop-item">Wishlist</Link>
                        {isAdmin && <Link to="/admin" className="wm-drop-item wm-drop-admin">Admin Panel</Link>}
                        <button onClick={signOut} className="wm-drop-item wm-drop-signout">Sign Out</button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="wm-drop-signin-btn">Sign In</Link>
                        <p className="wm-drop-register text-xs">
                          New customer? <Link to="/register" className="wm-drop-register-link">Create account</Link>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Cart Wrapper with hover mini-cart dropdown */}
                <div className="wm-minicart-wrap">
                  <Link to="/cart" className="wm-cart-btn hover:bg-white/10" aria-label={`Cart, ${cartCount} items`}>
                    <div className="wm-cart-icon-wrap">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="wm-action-icon">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"/>
                      </svg>
                      {cartCount > 0 && (
                        <span className="wm-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                      )}
                    </div>
                    <div>
                      <span className="wm-action-top">&nbsp;</span>
                      <span className="wm-action-bold">{formatPrice(cartTotal || 0)}</span>
                    </div>
                  </Link>

                  {/* Mini-Cart Hover Dropdown content */}
                  <div className="wm-minicart-drop">
                    <div className="wm-minicart-header">
                      <span className="wm-minicart-title">My Cart Preview</span>
                      <span className="wm-minicart-count">{cartCount} {cartCount === 1 ? 'item' : 'items'}</span>
                    </div>
                    
                    {cartItems && cartItems.length > 0 ? (
                      <>
                        <div className="wm-minicart-items scrollbar-none">
                          {cartItems.map((item) => (
                            <div key={item.id} className="wm-minicart-item">
                              <img src={item.image_url} alt="" className="wm-minicart-item-img" />
                              <div className="wm-minicart-item-info">
                                <p className="wm-minicart-item-name">{item.name}</p>
                                <p className="wm-minicart-item-qty">Qty: {item.quantity}</p>
                              </div>
                              <span className="wm-minicart-item-price">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="wm-minicart-footer">
                          <div className="wm-minicart-total-row">
                            <span className="wm-minicart-total-label">Subtotal:</span>
                            <span className="wm-minicart-total-value">{formatPrice(cartTotal || 0)}</span>
                          </div>
                          <div className="wm-minicart-actions">
                            <Link to="/cart" className="wm-minicart-btn-cart">View Cart</Link>
                            <Link to="/checkout" className="wm-minicart-btn-checkout">Checkout</Link>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="wm-minicart-empty">
                        <p className="text-2xl mb-1">🛒</p>
                        <p className="font-semibold">Your cart is empty</p>
                        <p className="text-xs text-gray-400 mt-1">Add hot sweets to satisfy your cravings!</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile hamburger menu */}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="wm-mobile-menu-btn"
                  aria-label="Open menu"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECONDARY CATEGORIES SUB-BAR ── */}
        <div className="wm-secondary-nav">
          <div className="wm-container">
            <nav className="wm-secondary-inner" aria-label="Department navigation">
              {SECONDARY_NAV.map((item) =>
                item.hasDrop ? (
                  <div key={item.label} className="wm-dept-wrap" ref={deptRef}>
                    <button
                      onClick={() => setDeptOpen(o => !o)}
                      className={`wm-sec-link wm-dept-btn ${deptOpen ? 'active' : ''}`}
                      aria-expanded={deptOpen}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <svg viewBox="0 0 20 20" fill="currentColor" className="wm-sec-chevron">
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                      </svg>
                    </button>
                    {deptOpen && (
                      <div className="wm-dept-drop">
                        <p className="wm-dept-drop-title">Traditional Food Depts</p>
                        {DEPARTMENTS.map(dept => (
                          <Link key={dept.label} to={dept.path} className="wm-dept-drop-item" onClick={() => setDeptOpen(false)}>
                            {dept.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link key={item.label} to={item.path || '/products'} className="wm-sec-link">
                    {item.label}
                  </Link>
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* ── INTERACTIVE location pin picker MODAL ── */}
      {locationModalOpen && (
        <div className="wm-modal-backdrop" onClick={() => setLocationModalOpen(false)}>
          <div className="wm-modal-content" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setLocationModalOpen(false)}
              className="wm-modal-close-btn"
              aria-label="Close location picker"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4.5 h-4.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <h3 className="wm-modal-title">How do you want your sweets?</h3>
            <p className="wm-modal-subtitle">Configure your ZIP / PIN code for delivery times and pickup stores.</p>

            <div className="wm-fulfillment-tabs">
              <button 
                onClick={() => setFulfillmentType('shipping')}
                className={`wm-fulfillment-tab ${fulfillmentType === 'shipping' ? 'active' : ''}`}
              >
                <span className="wm-fulfillment-tab-icon">🚚</span>
                <span>Shipping</span>
              </button>
              <button 
                onClick={() => setFulfillmentType('delivery')}
                className={`wm-fulfillment-tab ${fulfillmentType === 'delivery' ? 'active' : ''}`}
              >
                <span className="wm-fulfillment-tab-icon">🛵</span>
                <span>Delivery</span>
              </button>
              <button 
                onClick={() => setFulfillmentType('pickup')}
                className={`wm-fulfillment-tab ${fulfillmentType === 'pickup' ? 'active' : ''}`}
              >
                <span className="wm-fulfillment-tab-icon">🏪</span>
                <span>Pickup</span>
              </button>
            </div>

            <form onSubmit={handleZipSubmit} className="wm-zip-form">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Enter PIN / ZIP Code</label>
              <div className="wm-zip-input-group">
                <input 
                  type="text" 
                  maxLength={6} 
                  pattern="[0-9]*"
                  value={zipInput}
                  onChange={e => setZipInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 533001" 
                  className="wm-zip-input"
                  required
                />
                <button type="submit" className="wm-zip-submit-btn">Update</button>
              </div>

              {zipSuccess && (
                <div className="wm-zip-feedback">
                  <span>✓ Preferences updated successfully</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── MOBILE DRAWER ── */}
      <div className={`wm-mobile-overlay ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} aria-hidden={!mobileOpen} />
      <div className={`wm-mobile-drawer ${mobileOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Mobile menu">
        <div className="wm-mobile-drawer-header">
          <span className="wm-mobile-drawer-title">Menu</span>
          <button onClick={() => setMobileOpen(false)} className="wm-mobile-close" aria-label="Close menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearchSubmit} className="wm-mobile-search">
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="wm-mobile-search-input"
          />
          <button type="submit" className="wm-mobile-search-btn" aria-label="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
            </svg>
          </button>
        </form>

        <nav className="wm-mobile-nav">
          {user ? (
            <div className="wm-mobile-user bg-gradient-to-r from-blue-100 to-blue-50">
              <div className="wm-mobile-user-avatar">
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="wm-mobile-user-name">{displayName}</p>
                <p className="wm-mobile-user-email">{user.email}</p>
              </div>
            </div>
          ) : (
            <Link to="/login" className="wm-mobile-signin">Sign In / Register</Link>
          )}

          <div className="wm-mobile-links">
            <Link to="/" className="wm-mobile-link">Home</Link>
            <Link to="/products" className="wm-mobile-link">Products</Link>
            <Link to="/categories" className="wm-mobile-link">Categories</Link>
            <Link to="/cart" className="wm-mobile-link">Cart {cartCount > 0 && `(${cartCount})`}</Link>
            {user && <>
              <Link to="/orders" className="wm-mobile-link">My Orders</Link>
              <Link to="/wishlist" className="wm-mobile-link">Wishlist</Link>
              <Link to="/profile" className="wm-mobile-link">My Profile</Link>
              {isAdmin && <Link to="/admin" className="wm-mobile-link wm-mobile-admin">Admin Panel</Link>}
              <button onClick={signOut} className="wm-mobile-signout">Sign Out</button>
            </>}
          </div>
        </nav>
      </div>
    </>
  );
};

export default EnterpriseHeader;
