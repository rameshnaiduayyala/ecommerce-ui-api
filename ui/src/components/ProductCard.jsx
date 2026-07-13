import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

/* ── Star Rating ── */
const StarRating = ({ rating, count }) => {
  if (!rating && !count) return null;
  const full = Math.floor(rating || 0);
  const half = (rating || 0) - full >= 0.5;
  return (
    <div className="wm-stars-wrap" aria-label={`${rating} out of 5 stars, ${count} reviews`}>
      <div className="wm-stars" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="0 0 20 20" className={`wm-star ${i < full ? 'filled' : i === full && half ? 'half' : 'empty'}`}>
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        ))}
      </div>
      {count > 0 && <span className="wm-review-count">({count.toLocaleString()})</span>}
    </div>
  );
};

/* ── Walmart Product Card with Quick View Modal ── */
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [wishlisted, setWishlisted] = useState(false);
  const [qty, setQty] = useState(0);
  const [toast, setToast] = useState('');
  const [addAnim, setAddAnim] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [selectedThumb, setSelectedThumb] = useState(0);

  // Dynamic Pin Picker state
  const [fulfillment, setFulfillment] = useState({
    type: 'shipping',
    zip: '533001'
  });

  const price = Number(product.basePrice ?? product.price ?? 0);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const displayPrice = discountPrice || price;
  const priceInt = Math.floor(displayPrice);
  const priceDec = (displayPrice % 1).toFixed(2).split('.')[1] || '00';
  const oldPriceInt = Math.floor(price);
  const oldPriceDec = (price % 1).toFixed(2).split('.')[1] || '00';
  const discount = discountPrice && price > discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : null;

  const imgSrc = product.image_url
    || product.images?.[0]?.url
    || `https://placehold.co/400x400/f0f4ff/0071CE?text=${encodeURIComponent((product.name || '?').substring(0, 2))}`;

  // Image list for Quick View slider
  const productImages = product.images?.length 
    ? product.images.map(img => img.url)
    : [imgSrc];

  const category = product.category || product.categories?.[0]?.category?.name || '';

  // Fetch wishlist & fulfillment preference from localStorage
  useEffect(() => {
    try {
      const wl = JSON.parse(localStorage.getItem('wm_wishlist') || '[]');
      setWishlisted(wl.some(i => i.id === product.id));

      const zip = localStorage.getItem('wm_zip') || '533001';
      const type = localStorage.getItem('wm_fulfillment_type') || 'shipping';
      setFulfillment({ type, zip });
    } catch {}
  }, [product.id]);

  // Listen for Zip changes triggered globally
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const zip = localStorage.getItem('wm_zip') || '533001';
        const type = localStorage.getItem('wm_fulfillment_type') || 'shipping';
        setFulfillment({ type, zip });
      } catch {}
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('wm-fulfillment-updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('wm-fulfillment-updated', handleStorageChange);
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const wl = JSON.parse(localStorage.getItem('wm_wishlist') || '[]');
      const updated = wishlisted
        ? wl.filter(i => i.id !== product.id)
        : [...wl, { ...product, price, image_url: imgSrc }];
      localStorage.setItem('wm_wishlist', JSON.stringify(updated));
      setWishlisted(!wishlisted);
      showToast(wishlisted ? 'Removed from list' : 'Added to list ♥');
    } catch {}
  };

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart({ ...product, price, image_url: imgSrc }, 1);
    setQty(1);
    setAddAnim(true);
    showToast(`Added to cart`);
    setTimeout(() => setAddAnim(false), 500);
  };

  const handleIncrease = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart({ ...product, price, image_url: imgSrc }, 1);
    setQty(q => q + 1);
  };

  const handleDecrease = (e) => {
    e.preventDefault(); e.stopPropagation();
    setQty(q => Math.max(0, q - 1));
  };

  const openQuickView = (e) => {
    e.preventDefault(); e.stopPropagation();
    setQuickViewOpen(true);
  };

  // Generate dynamic shipping tags based on selected option
  const getFulfillmentText = () => {
    if (fulfillment.type === 'pickup') {
      return `Free pickup at Rajahmundry (Store ${fulfillment.zip})`;
    } else if (fulfillment.type === 'delivery') {
      return `Free local delivery tomorrow to ${fulfillment.zip}`;
    }
    return `Free shipping with ₹999 orders`;
  };

  return (
    <>
      <article className="wm-product-card group" aria-label={product.name}>
        {/* Toast notification */}
        {toast && (
          <div className="wm-toast" role="alert" aria-live="polite">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-green-400">
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd"/>
            </svg>
            {toast}
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className={`wm-wishlist-btn ${wishlisted ? 'active' : ''}`}
          aria-label={wishlisted ? 'Remove from list' : 'Add to list'}
          aria-pressed={wishlisted}
        >
          <svg viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="w-4.5 h-4.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>
          </svg>
        </button>

        {/* Image wrapper */}
        <div className="wm-product-img-wrap">
          <Link to={`/products/${product.id}`} className="block relative aspect-square" tabIndex={0}>
            {discount && (
              <span className="wm-reduced-badge">Reduced price</span>
            )}
            <img
              src={imgSrc}
              alt={product.name}
              className="wm-product-img"
              loading="lazy"
              onError={e => { e.target.src = `https://placehold.co/400x400/f0f4ff/BA242A?text=${encodeURIComponent((product.name || '?').substring(0, 2))}`; }}
            />
            <div className="wm-product-img-overlay" aria-hidden="true" />
          </Link>

          {/* Quick View Button - overlay on hover */}
          <button 
            onClick={openQuickView} 
            className="wm-qv-trigger-btn"
            aria-label={`Quick view of ${product.name}`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd"/>
            </svg>
            Quick View
          </button>
        </div>

        {/* Content */}
        <div className="wm-product-body">
          {/* Category tag */}
          {category && (
            <span className="wm-product-category">{category}</span>
          )}

          {/* Name */}
          <Link to={`/products/${product.id}`}>
            <h3 className="wm-product-name">{product.name}</h3>
          </Link>

          {/* Rating */}
          <StarRating rating={product.rating} count={product.reviewCount} />

          {/* Shipping / Fulfillment Badge */}
          <p className="wm-product-shipping">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-600 inline mr-1">
              <path d="M6.5 3c-1.051 0-2.093.04-3.125.117A1.49 1.49 0 0 0 2 4.607V10.5h9V4.606c0-.771-.59-1.43-1.375-1.489A41.568 41.568 0 0 0 6.5 3ZM2 12v2.5A1.5 1.5 0 0 0 3.5 16h.041a3 3 0 0 1 5.918 0h.791a.75.75 0 0 0 .75-.75V12H2ZM6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM13.25 5a.75.75 0 0 0-.75.75v8.514a3.001 3.001 0 0 1 4.893 1.44c.37-.275.657-.644.657-1.154V11.5a4 4 0 0 0-4-4h-.75v-.75a.75.75 0 0 0-.05-.267V5ZM14 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
            </svg>
            {getFulfillmentText()}
          </p>

          {/* Price + Add to Cart */}
          <div className="wm-product-footer">
            <div className="wm-price-wrap">
              {discountPrice ? (
                <>
                  <span className="wm-price-now">
                    ₹{priceInt}
                    <sup className="wm-price-decimal-sup">.{priceDec}</sup>
                  </span>
                  <div className="wm-price-was-wrap">
                    <span className="wm-price-was">₹{price.toFixed(0)}</span>
                    <span className="wm-price-save">Save {discount}%</span>
                  </div>
                </>
              ) : (
                <span className="wm-price-now">
                  ₹{priceInt}
                  <sup className="wm-price-decimal-sup">.{priceDec}</sup>
                </span>
              )}
            </div>

            {qty === 0 ? (
              <button
                onClick={handleAdd}
                className={`wm-add-btn ${addAnim ? 'added' : ''}`}
                aria-label={`Add ${product.name} to cart`}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z"/>
                </svg>
                Add
              </button>
            ) : (
              <div className="wm-qty-ctrl" role="group" aria-label="Quantity control">
                <button onClick={handleDecrease} className="wm-qty-btn" aria-label="Decrease quantity">−</button>
                <span className="wm-qty-val" aria-live="polite">{qty}</span>
                <button onClick={handleIncrease} className="wm-qty-btn" aria-label="Increase quantity">+</button>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* ── QUICK VIEW MODAL OVERLAY ── */}
      {quickViewOpen && (
        <div 
          className="wm-quickview-backdrop" 
          onClick={() => setQuickViewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Quick view of ${product.name}`}
        >
          <div className="wm-quickview-content" onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={() => setQuickViewOpen(false)} 
              className="wm-modal-close-btn"
              aria-label="Close modal"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            {/* Grid Layout */}
            <div className="wm-quickview-grid">
              {/* Left Side: Images */}
              <div className="wm-qv-images">
                <div className="wm-qv-main-img-wrap">
                  <img 
                    src={productImages[selectedThumb]} 
                    alt={product.name} 
                    className="wm-qv-main-img" 
                  />
                </div>
                {productImages.length > 1 && (
                  <div className="wm-qv-thumbs">
                    {productImages.map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedThumb(idx)}
                        className={`wm-qv-thumb-btn ${idx === selectedThumb ? 'active' : ''}`}
                      >
                        <img src={img} alt="thumbnail" className="wm-qv-thumb-img" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Details */}
              <div className="wm-qv-details">
                {category && <span className="wm-qv-category">{category}</span>}
                <h2 className="wm-qv-title">{product.name}</h2>
                
                <StarRating rating={product.rating} count={product.reviewCount} />

                {discount && <span className="wm-qv-badge">Reduced price</span>}

                <div className="wm-qv-price-row">
                  <span className="wm-qv-price-now" style={{ display: 'inline-flex', alignItems: 'flex-start' }}>
                    ₹{priceInt}
                    <sup style={{ fontSize: '11px', fontWeight: '700', top: '-0.25em', marginLeft: '1px', position: 'relative' }}>.{priceDec}</sup>
                  </span>
                  {discountPrice && (
                    <>
                      <span className="wm-qv-price-was">₹{price.toFixed(0)}</span>
                      <span className="wm-qv-price-save">Save {discount}%</span>
                    </>
                  )}
                </div>

                <div className="wm-qv-divider" />

                {/* Description */}
                <div>
                  <h4 className="wm-qv-desc-title">Product Description</h4>
                  <p className="wm-qv-desc">
                    {product.description || 'Enjoy our fresh and traditional confectionery handcrafted using premium ingredients. Directly prepared and packed under hygienic standards.'}
                  </p>
                </div>

                {product.admin_note && (
                  <div className="p-3 bg-amber-50 rounded-lg text-xs border border-amber-100 text-amber-800 font-medium">
                    ✨ {product.admin_note}
                  </div>
                )}

                <div className="wm-qv-divider" />

                {/* Fulfillment text in modal */}
                <p className="text-xs text-green-700 font-bold flex items-center gap-1.5">
                  🚚 {getFulfillmentText()}
                </p>

                {/* Adding Actions */}
                <div className="wm-qv-actions-row">
                  <div className="wm-qv-qty-stepper">
                    <button 
                      onClick={() => setQty(q => Math.max(0, q - 1))} 
                      className="wm-qv-qty-btn"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="wm-qv-qty-val">{qty}</span>
                    <button 
                      onClick={() => {
                        addToCart({ ...product, price, image_url: imgSrc }, 1);
                        setQty(q => q + 1);
                      }} 
                      className="wm-qv-qty-btn"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button 
                    onClick={(e) => {
                      if (qty === 0) {
                        addToCart({ ...product, price, image_url: imgSrc }, 1);
                        setQty(1);
                      }
                      setAddAnim(true);
                      showToast(`Added to cart`);
                      setTimeout(() => {
                        setAddAnim(false);
                        setQuickViewOpen(false);
                      }, 600);
                    }} 
                    className={`wm-qv-add-btn ${addAnim ? 'added' : ''}`}
                  >
                    {addAnim ? 'Added ✓' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
