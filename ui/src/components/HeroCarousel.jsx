import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

const DEFAULT_SLIDES = [
  {
    id: 1,
    badge: '🔥 Hot Deals',
    headline: 'Big Savings\nJust Dropped',
    sub: 'Shop thousands of items at rollback prices — updated daily.',
    cta: 'Shop Now',
    ctaLink: '/products',
    ctaSecondary: 'Browse Deals',
    ctaSecondaryLink: '/categories',
    bgColor: '#FFF8E7',
    accentColor: '#0071CE',
    products: [
      { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80', label: 'Watches' },
      { src: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&q=80', label: 'Beauty' },
      { src: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300&q=80', label: 'Sports' },
    ],
    rollback: 'Rollbacks & More',
  },
  {
    id: 2,
    badge: '✨ New Arrivals',
    headline: 'Fresh Finds\nEvery Week',
    sub: 'Discover trending products across all categories, delivered fast.',
    cta: 'Shop New Arrivals',
    ctaLink: '/products',
    ctaSecondary: 'View All',
    ctaSecondaryLink: '/categories',
    bgColor: '#EBF5FF',
    accentColor: '#0071CE',
    products: [
      { src: 'https://images.unsplash.com/photo-1593640408182-31c228b2e2c2?w=300&q=80', label: 'Electronics' },
      { src: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&q=80', label: 'Photography' },
      { src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80', label: 'Footwear' },
    ],
    rollback: 'New This Week',
  },
  {
    id: 3,
    badge: '⚡ Flash Sale',
    headline: 'Save More\nSpend Less',
    sub: 'Exclusive online-only pricing on top brands. Limited time only.',
    cta: 'Grab the Deal',
    ctaLink: '/products',
    ctaSecondary: 'All Categories',
    ctaSecondaryLink: '/categories',
    bgColor: '#FFF0F0',
    accentColor: '#C8102E',
    products: [
      { src: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&q=80', label: 'Skincare' },
      { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80', label: 'Headphones' },
      { src: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=300&q=80', label: 'Laptops' },
    ],
    rollback: 'Flash Deals',
  },
];

const HeroCarousel = ({ slides: propSlides }) => {
  const slides = propSlides?.length ? propSlides : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef(null);

  const goTo = useCallback((idx) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(idx);
    setTimeout(() => setAnimating(false), 400);
  }, [animating]);

  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);

  useEffect(() => {
    if (paused) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [paused, next]);

  const slide = slides[current];

  return (
    <section
      className="wm-hero-section"
      style={{ backgroundColor: slide.bgColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured promotions carousel"
    >
      <div className="wm-container">
        <div className="wm-hero-inner">

          {/* LEFT: Text Content */}
          <div className="wm-hero-content" key={`content-${current}`}>
            <span className="wm-hero-badge">{slide.badge}</span>

            <h1 className="wm-hero-headline">
              {slide.headline.split('\n').map((line, i) => (
                <span key={i}>
                  {i === 1 ? <span style={{ color: slide.accentColor }}>{line}</span> : line}
                  {i < slide.headline.split('\n').length - 1 && <br />}
                </span>
              ))}
            </h1>

            <p className="wm-hero-sub">{slide.sub}</p>

            <div className="wm-hero-ctas">
              <Link to={slide.ctaLink} className="wm-hero-cta-primary" style={{ backgroundColor: slide.accentColor }}>
                {slide.cta}
              </Link>
              <Link to={slide.ctaSecondaryLink} className="wm-hero-cta-ghost">
                {slide.ctaSecondary}
              </Link>
            </div>

            {/* Trust row */}
            <div className="wm-hero-trust">
              <span className="wm-hero-trust-item">✓ Free shipping $35+</span>
              <span className="wm-hero-trust-item">✓ Easy returns</span>
              <span className="wm-hero-trust-item">✓ Price match</span>
            </div>
          </div>

          {/* RIGHT: Product Grid */}
          <div className="wm-hero-products" key={`products-${current}`}>
            {slide.products?.map((p, i) => (
              <Link
                key={i}
                to={slide.ctaLink}
                className={`wm-hero-product-card wm-hero-product-${i}`}
                tabIndex={-1}
              >
                <div className="wm-hero-product-img-wrap">
                  <img
                    src={p.src}
                    alt={p.label}
                    className="wm-hero-product-img"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    onError={e => { e.target.src = `https://placehold.co/300x300/f0f4ff/0071CE?text=${encodeURIComponent(p.label)}`; }}
                  />
                </div>
                <span className="wm-hero-product-label">{p.label}</span>
              </Link>
            ))}

            {/* Rollback badge card */}
            <div className="wm-hero-rollback-card" style={{ backgroundColor: slide.accentColor }}>
              <span className="wm-hero-rollback-text">{slide.rollback}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="wm-hero-rollback-arrow">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="wm-hero-controls">
        <button onClick={prev} className="wm-hero-nav-btn" aria-label="Previous slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
          </svg>
        </button>

        <button
          onClick={() => setPaused(p => !p)}
          className="wm-hero-nav-btn"
          aria-label={paused ? 'Play carousel' : 'Pause carousel'}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd"/>
            </svg>
          )}
        </button>

        <div className="wm-hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`wm-hero-dot ${i === current ? 'active' : ''}`}
            />
          ))}
        </div>

        <button onClick={next} className="wm-hero-nav-btn" aria-label="Next slide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
          </svg>
        </button>
      </div>

      {/* Slide counter */}
      <div className="wm-hero-counter" aria-live="polite" aria-atomic="true">
        {current + 1} / {slides.length}
      </div>
    </section>
  );
};

export default HeroCarousel;
