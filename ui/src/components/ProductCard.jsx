import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';

const StarRating = ({ rating, count }) => {
  if (!rating) return null;
  const stars = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
            fill={i < stars ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={1.5}
            className="w-3 h-3">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {count > 0 && <span className="text-[9px] text-muted-foreground font-medium">({count})</span>}
    </div>
  );
};

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [toast, setToast] = useState('');
  const [qty, setQty] = useState(0);
  const [addedAnim, setAddedAnim] = useState(false);

  // Normalize price from either field
  const price = Number(product.basePrice ?? product.price ?? 0);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const displayPrice = discountPrice || price;
  const discount = discountPrice && price > discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : null;

  // Image from API images array or legacy image_url
  const imgSrc = product.image_url
    || product.images?.[0]?.url
    || `https://placehold.co/400x400/faf0eb/BA242A?text=${encodeURIComponent((product.name || '?').charAt(0))}`;

  const category = product.category || product.categories?.[0]?.category?.name || '';

  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem('sweetverse_wishlist') || '[]');
    setIsWishlisted(wl.some(i => i.id === product.id));
  }, [product.id]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  const handleWishlist = (e) => {
    e.preventDefault(); e.stopPropagation();
    const wl = JSON.parse(localStorage.getItem('sweetverse_wishlist') || '[]');
    const updated = isWishlisted
      ? wl.filter(i => i.id !== product.id)
      : [...wl, { ...product, price, image_url: imgSrc }];
    localStorage.setItem('sweetverse_wishlist', JSON.stringify(updated));
    setIsWishlisted(!isWishlisted);
    showToast(isWishlisted ? 'Removed from Wishlist' : 'Added to Wishlist ❤️');
  };

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart({ ...product, price, image_url: imgSrc }, 1);
    setQty(1);
    setAddedAnim(true);
    showToast(`${product.name} added to cart`);
    setTimeout(() => setAddedAnim(false), 600);
  };

  const handleQtyIncrease = (e) => {
    e.preventDefault(); e.stopPropagation();
    addToCart({ ...product, price, image_url: imgSrc }, 1);
    setQty(q => q + 1);
  };

  const handleQtyDecrease = (e) => {
    e.preventDefault(); e.stopPropagation();
    setQty(q => {
      const newQ = Math.max(0, q - 1);
      return newQ;
    });
  };

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-border/50 hover:border-primary/20 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#1a1a1a] text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Image Area */}
      <Link to={`/products/${product.id}`} className="relative overflow-hidden bg-[#faf8f5] aspect-square block shrink-0">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
          onError={e => { e.target.src = `https://placehold.co/400x400/faf0eb/BA242A?text=${encodeURIComponent((product.name || '?').charAt(0))}`; }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Discount badge */}
        {discount && (
          <div className="absolute top-2.5 left-2.5 bg-primary text-white text-[9px] font-black px-2 py-0.5 rounded-lg">
            {discount}% OFF
          </div>
        )}

        {/* Admin note badge */}
        {product.admin_note && (
          <div className="absolute bottom-2.5 left-2.5 right-10 bg-white/95 backdrop-blur-sm text-[9px] font-bold text-primary px-2 py-1 rounded-lg shadow-sm border border-primary/10 truncate">
            {product.admin_note}
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full border shadow-sm transition-all duration-200 ${
            isWishlisted
              ? 'bg-primary border-primary text-white scale-110'
              : 'bg-white/90 backdrop-blur-sm border-white/60 text-[#444] hover:bg-white hover:text-primary hover:scale-110'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>
      </Link>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 gap-1.5">

        {/* Category */}
        {category && (
          <span className="text-[9px] font-black tracking-[0.2em] uppercase text-primary/70">
            {category}
          </span>
        )}

        {/* Name */}
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold text-[13.5px] text-[#1a1a1a] leading-snug hover:text-primary transition-colors line-clamp-2 font-sans">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <StarRating rating={product.rating} count={product.reviewCount} />

        {/* Price + Add button row */}
        <div className="flex items-center justify-between mt-auto pt-1.5">
          <div className="flex flex-col">
            <span className="text-base font-black text-[#1a1a1a] leading-none">
              ₹{displayPrice.toFixed(0)}
            </span>
            {discountPrice && (
              <span className="text-[10px] text-muted-foreground line-through mt-0.5">
                ₹{price.toFixed(0)}
              </span>
            )}
          </div>

          {/* Blinkit-style qty control */}
          {qty === 0 ? (
            <button
              onClick={handleAdd}
              className={`add-btn ${addedAnim ? '!bg-emerald-500 scale-95' : ''}`}
              aria-label="Add to cart"
            >
              +
            </button>
          ) : (
            <div className="qty-stepper">
              <button onClick={handleQtyDecrease} aria-label="Decrease">−</button>
              <span>{qty}</span>
              <button onClick={handleQtyIncrease} aria-label="Increase">+</button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-primary w-0 group-hover:w-full transition-all duration-500 rounded-full" />
    </div>
  );
};

export default ProductCard;
