import { Link } from 'react-router-dom';
import { useRef } from 'react';

const FALLBACK_ICONS = ['🛒','📱','👗','🏠','⚽','🧸','💊','💄','📚','🍕','🎮','🚗','✈️','🎵','🌿','🐾'];

const CategoryStrip = ({ categories = [], loading = false }) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });

  if (loading) {
    return (
      <section className="wm-cat-section" aria-label="Categories loading">
        <div className="wm-container">
          <div className="wm-section-header">
            <div className="wm-section-title-wrap">
              <h2 className="wm-section-title">Shop by Category</h2>
              <p className="wm-section-sub">Explore our wide selection</p>
            </div>
          </div>
          <div className="wm-cat-strip">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="wm-cat-item-skeleton">
                <div className="wm-cat-img-skeleton skeleton" />
                <div className="wm-cat-label-skeleton skeleton" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!categories.length) return null;

  return (
    <section className="wm-cat-section" aria-label="Shop by category">
      <div className="wm-container">
        <div className="wm-section-header">
          <div className="wm-section-title-wrap">
            <h2 className="wm-section-title">Shop by Category</h2>
            <p className="wm-section-sub">Explore our wide selection of products</p>
          </div>
          <Link to="/categories" className="wm-view-all-link">
            View all <svg viewBox="0 0 20 20" fill="currentColor" className="wm-view-all-arrow"><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd"/></svg>
          </Link>
        </div>

        {/* Scrollable Strip */}
        <div className="wm-cat-scroll-wrap">
          {/* Left arrow */}
          <button
            onClick={scrollLeft}
            className="wm-cat-scroll-btn wm-cat-scroll-left"
            aria-label="Scroll categories left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>

          <div ref={scrollRef} className="wm-cat-strip scrollbar-none" role="list">
            {categories.map((cat, idx) => {
              const imgSrc = cat.image_url || cat.imageUrl || null;
              const icon = FALLBACK_ICONS[idx % FALLBACK_ICONS.length];
              return (
                <Link
                  key={cat.id}
                  to="/categories"
                  state={{ selectedCategoryId: cat.id }}
                  className="wm-cat-item group"
                  role="listitem"
                  aria-label={`Shop ${cat.name}`}
                >
                  <div className="wm-cat-img-wrap">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={cat.name}
                        className="wm-cat-img"
                        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <span className="wm-cat-icon" style={imgSrc ? { display: 'none' } : {}}>
                      {icon}
                    </span>
                  </div>
                  <span className="wm-cat-label">{cat.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            onClick={scrollRight}
            className="wm-cat-scroll-btn wm-cat-scroll-right"
            aria-label="Scroll categories right"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CategoryStrip;
