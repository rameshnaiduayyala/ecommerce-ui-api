import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logoImg from '../assets/logo.png';

const DEPARTMENTS = [
  { label: 'Electronics', path: '/categories' },
  { label: 'Clothing', path: '/categories' },
  { label: 'Grocery', path: '/categories' },
  { label: 'Home & Garden', path: '/categories' },
  { label: 'Sports', path: '/categories' },
  { label: 'Toys', path: '/categories' },
  { label: 'Health', path: '/categories' },
  { label: 'Beauty', path: '/categories' },
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
  const { cartCount, cartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const deptRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDeptOpen(false);
  }, [location]);

  // Close dept dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (deptRef.current && !deptRef.current.contains(e.target)) setDeptOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const displayName = user
    ? (user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Account')
    : 'Sign In';

  return (
    <>
      {/* ── TOP ROW ── */}
      <header className={`sticky top-0 z-50 w-full transition-shadow duration-200 ${scrolled ? 'shadow-md' : ''}`}>
        <div className="wm-header-top">
          <div className="wm-container">
            <div className="wm-top-inner">

              {/* Logo */}
              <Link to="/" className="wm-logo-wrap" aria-label="Home">
                <div className="wm-spark">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="wm-spark-svg">
                    <path d="M16 2L17.8 9.2L24 6L20.8 12.2L28 14L20.8 15.8L24 22L17.8 18.8L16 26L14.2 18.8L8 22L11.2 15.8L4 14L11.2 12.2L8 6L14.2 9.2L16 2Z" fill="#FFC220"/>
                  </svg>
                </div>
                <div className="wm-logo-text">
                  <span className="wm-logo-brand">ShopEnterprise</span>
                  <span className="wm-logo-sub">Save money. Live better.</span>
                </div>
              </Link>

              {/* Pickup/Delivery location */}
              <button className="wm-location-btn" aria-label="Change pickup location">
                <svg className="wm-location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/>
                </svg>
                <div className="wm-location-text">
                  <span className="wm-location-label">Pickup or delivery?</span>
                  <span className="wm-location-address">Select your location</span>
                </div>
                <svg className="wm-chevron" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"/>
                </svg>
              </button>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className={`wm-search-form ${searchFocused ? 'focused' : ''}`} role="search">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search everything at ShopEnterprise online and in store"
                  className="wm-search-input"
                  aria-label="Search products"
                />
                <button type="submit" className="wm-search-btn" aria-label="Search">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="wm-search-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                  </svg>
                </button>
              </form>

              {/* Right Actions */}
              <div className="wm-right-actions">

                {/* Reorder */}
                <Link to="/orders" className="wm-action-btn" aria-label="Reorder items">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="wm-action-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
                  </svg>
                  <div>
                    <span className="wm-action-top">Reorder</span>
                    <span className="wm-action-bold">My Items</span>
                  </div>
                </Link>

                {/* Account */}
                <div className="wm-account-wrap group">
                  <button className="wm-action-btn" aria-label="Account">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="wm-action-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
                    </svg>
                    <div>
                      <span className="wm-action-top">{user ? 'Welcome back' : 'Sign In'}</span>
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
                          <p className="wm-drop-email">{user.email}</p>
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
                        <p className="wm-drop-register">
                          New customer? <Link to="/register" className="wm-drop-register-link">Create account</Link>
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Cart */}
                <Link to="/cart" className="wm-cart-btn" aria-label={`Cart, ${cartCount} items`}>
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
                    <span className="wm-action-bold">${cartTotal ? cartTotal.toFixed(2) : '0.00'}</span>
                  </div>
                </Link>

                {/* Mobile hamburger */}
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

        {/* ── SECONDARY NAV ── */}
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
                        <p className="wm-dept-drop-title">All Departments</p>
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
        <form onSubmit={handleSearch} className="wm-mobile-search">
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
            <div className="wm-mobile-user">
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
