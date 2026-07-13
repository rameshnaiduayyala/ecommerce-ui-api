import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import HeroCarousel from '../components/HeroCarousel';
import CategoryStrip from '../components/CategoryStrip';
import ProductCard from '../components/ProductCard';
import { getCategories, getProducts } from '../api/catalog';
import { getStoreSettings } from '../api/admin';

const PROMO_BANNERS = [
  {
    id: 1,
    title: 'Free Pickup Today',
    desc: 'Order by 5 PM for same-day store pickup in Rajahmundry — no extra charge.',
    icon: '🏪',
    bg: '#EBF5FF',
    color: '#0071CE',
    link: '/products',
  },
  {
    id: 2,
    title: 'Fresh Batch Prices',
    desc: 'Everyday savings on freshly made sweets — direct from Konaseema kitchen.',
    icon: '💰',
    bg: '#FFF8E7',
    color: '#F5A623',
    link: '/products',
  },
  {
    id: 3,
    title: 'Fast & Free Delivery',
    desc: 'Get free delivery on orders over ₹999. Pan-India shipping available.',
    icon: '🚚',
    bg: '#EDFBF0',
    color: '#1A9E43',
    link: '/products',
  },
];

const TRUST_ITEMS = [
  { icon: '🔒', title: 'Secure Checkout', desc: 'SSL encrypted, safe & secure' },
  { icon: '🍬', title: 'Freshness Guaranteed', desc: 'Made fresh, vacuum sealed daily' },
  { icon: '🏆', title: 'Pure Ingredients', desc: '100% pure ghee, no adulteration' },
  { icon: '📞', title: '24/7 Support', desc: 'Always here to help you' },
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals]           = useState([]);
  const [categories, setCategories]             = useState([]);
  const [settings, setSettings]                 = useState({});
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [featured, arrivals, cats, settingsData] = await Promise.all([
          getProducts({ take: 8, status: 'PUBLISHED', sortBy: 'createdAt', sortOrder: 'desc' }),
          getProducts({ take: 4, status: 'PUBLISHED', sortBy: 'createdAt', sortOrder: 'asc' }),
          getCategories(),
          getStoreSettings(),
        ]);
        setFeaturedProducts(featured || []);
        setNewArrivals(arrivals || []);
        setCategories(cats || []);
        if (settingsData) setSettings(settingsData);
      } catch (err) {
        console.error('Homepage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="wm-homepage">

      {/* ── HERO CAROUSEL ── */}
      <HeroCarousel slides={settings.hero_slides} />

      {/* ── PROMO BANNERS ── */}
      <section className="wm-promo-section" aria-label="Promotions">
        <div className="wm-container">
          <div className="wm-promo-grid">
            {PROMO_BANNERS.map(b => (
              <Link key={b.id} to={b.link} className="wm-promo-card" style={{ '--promo-bg': b.bg, '--promo-color': b.color }}>
                <span className="wm-promo-icon">{b.icon}</span>
                <div>
                  <p className="wm-promo-title">{b.title}</p>
                  <p className="wm-promo-desc">{b.desc}</p>
                </div>
                <svg viewBox="0 0 20 20" fill="currentColor" className="wm-promo-arrow">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <CategoryStrip categories={categories} loading={loading} />

      {/* ── FEATURED PRODUCTS ── */}
      <section className="wm-products-section" aria-labelledby="featured-heading">
        <div className="wm-container">
          <div className="wm-section-header">
            <div className="wm-section-title-wrap">
              <h2 className="wm-section-title" id="featured-heading">Discover Great Brands</h2>
              <p className="wm-section-sub">Handpicked products from top-rated brands</p>
            </div>
            <Link to="/products" className="wm-view-all-link">
              Shop all
              <svg viewBox="0 0 20 20" fill="currentColor" className="wm-view-all-arrow">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd"/>
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="wm-product-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="wm-product-card-skeleton">
                  <div className="wm-product-img-skeleton skeleton" />
                  <div className="wm-product-body-skeleton">
                    <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4, marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 14, width: '100%', borderRadius: 4, marginBottom: 4 }} />
                    <div className="skeleton" style={{ height: 14, width: '80%', borderRadius: 4, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 4, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 32, width: '100%', borderRadius: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="wm-product-grid">
              {featuredProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="wm-empty-products">
              <div className="wm-empty-icon">🛍️</div>
              <h3 className="wm-empty-title">No products yet</h3>
              <p className="wm-empty-desc">Add products from the Admin Dashboard to see them here.</p>
              <Link to="/admin" className="wm-empty-cta">Go to Admin</Link>
            </div>
          )}
        </div>
      </section>

      {/* ── DEAL BANNER ── */}
      <section className="wm-deal-banner-section" aria-label="Special offer">
        <div className="wm-container">
          <div className="wm-deal-banner">
            <div className="wm-deal-banner-content">
              <span className="wm-deal-badge">⚡ Limited Time</span>
              <h2 className="wm-deal-title">
                Free Shipping on Orders Over ₹{settings.free_shipping_threshold || '999'}
              </h2>
              <p className="wm-deal-desc">
                Shop from thousands of items and get fast, reliable delivery right to your door.
              </p>
            </div>
            <Link to="/products" className="wm-deal-cta">Start Shopping</Link>
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ── */}
      {!loading && newArrivals.length > 0 && (
        <section className="wm-products-section" aria-labelledby="arrivals-heading">
          <div className="wm-container">
            <div className="wm-section-header">
              <div className="wm-section-title-wrap">
                <h2 className="wm-section-title" id="arrivals-heading">New This Week</h2>
                <p className="wm-section-sub">Fresh arrivals, just landed</p>
              </div>
              <Link to="/products" className="wm-view-all-link">
                See all new
                <svg viewBox="0 0 20 20" fill="currentColor" className="wm-view-all-arrow">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd"/>
                </svg>
              </Link>
            </div>
            <div className="wm-product-grid-4">
              {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── TRUST BADGES ── */}
      <section className="wm-trust-section" aria-label="Why shop with us">
        <div className="wm-container">
          <div className="wm-trust-grid">
            {TRUST_ITEMS.map(t => (
              <div key={t.title} className="wm-trust-item">
                <span className="wm-trust-icon">{t.icon}</span>
                <div>
                  <p className="wm-trust-title">{t.title}</p>
                  <p className="wm-trust-desc">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
