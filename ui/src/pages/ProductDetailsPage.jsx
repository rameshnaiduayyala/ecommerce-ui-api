import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductByIdOrSlug, getProducts } from '../api/catalog';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';

const StarDisplay = ({ rating, count }) => {
  const stars = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
            fill={i < stars ? '#F59E0B' : 'none'} stroke="#F59E0B" strokeWidth={1.5}
            className="w-4 h-4">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs font-bold text-[#1a1a1a]">{rating ? rating.toFixed(1) : '0.0'}</span>
      {count > 0 && <span className="text-xs text-muted-foreground">({count} reviews)</span>}
    </div>
  );
};

const ProductDetailsPage = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct]               = useState(null);
  const [related, setRelated]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [quantity, setQuantity]             = useState(1);
  const [selectedImage, setSelectedImage]   = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isWishlisted, setIsWishlisted]     = useState(false);
  const [toast, setToast]                   = useState('');
  const [addedAnim, setAddedAnim]           = useState(false);
  const [activeTab, setActiveTab]           = useState('description');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400); };

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getProductByIdOrSlug(id);
        if (!data) return;
        setProduct(data);
        if (data.variants?.length > 0) setSelectedVariant(data.variants[0]);
        setSelectedImage(0);

        // Wishlist check
        const wl = JSON.parse(localStorage.getItem('sweetverse_wishlist') || '[]');
        setIsWishlisted(wl.some(i => i.id === data.id));

        // Related products
        const catId = data.categories?.[0]?.categoryId || data.categories?.[0]?.category?.id;
        const relatedData = await getProducts({ categoryId: catId, take: 4, status: 'PUBLISHED' });
        setRelated((relatedData || []).filter(p => p.id !== data.id).slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetch();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const price = Number(selectedVariant?.price ?? product.basePrice ?? product.price ?? 0);
    addToCart({ ...product, price, image_url: images[0] }, quantity);
    setAddedAnim(true);
    showToast(`${quantity}× ${product.name} added to cart`);
    setTimeout(() => setAddedAnim(false), 600);
  };

  const handleWishlist = () => {
    const wl = JSON.parse(localStorage.getItem('sweetverse_wishlist') || '[]');
    const updated = isWishlisted
      ? wl.filter(i => i.id !== product.id)
      : [...wl, { ...product, price, image_url: images[0] }];
    localStorage.setItem('sweetverse_wishlist', JSON.stringify(updated));
    setIsWishlisted(!isWishlisted);
    showToast(isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist ❤️');
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-6 w-1/3 rounded" />
          <div className="skeleton h-10 w-3/4 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-4/5 rounded" />
          <div className="skeleton h-12 w-1/3 rounded" />
          <div className="skeleton h-14 w-full rounded-full mt-4" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Product Not Found</h1>
      <p className="text-muted-foreground mb-6">This product doesn't exist or has been removed.</p>
      <Link to="/products" className="btn-primary">Browse All Products</Link>
    </div>
  );

  const images = (product.images && product.images.length > 0)
    ? product.images.map(i => i?.url).filter(Boolean)
    : [product.image_url || `https://placehold.co/600x600/faf0eb/BA242A?text=${encodeURIComponent(product.name?.charAt(0) || '?')}`];

  const price = Number(selectedVariant?.price ?? product.basePrice ?? product.price ?? 0);
  const originalPrice = Number(product.basePrice ?? product.price ?? 0);
  const discount = selectedVariant && price < originalPrice
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;
  const category = product.category || product.categories?.[0]?.category?.name;
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((a, r) => a + (r.rating || 0), 0) / product.reviews.length
    : null;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      {toast && (
        <div className="fixed bottom-6 right-6 z-[9999] bg-[#1a1a1a] text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />{toast}
        </div>
      )}

      <div className="container mx-auto px-4 md:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8 font-medium">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
          {category && <><span>/</span><Link to="/categories" className="hover:text-primary transition-colors">{category}</Link></>}
          <span>/</span>
          <span className="text-[#1a1a1a] font-semibold truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">

          {/* ── IMAGE GALLERY ── */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex flex-col gap-2 shrink-0">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === i ? 'border-primary scale-105' : 'border-border/50 hover:border-primary/40'
                    }`}
                  >
                    <img src={img} alt={`${product.name} view ${i+1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-[#faf8f5] border border-border/40 shadow-sm">
                <img
                  src={images[selectedImage] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={e => { e.target.src = `https://placehold.co/600x600/faf0eb/BA242A?text=${encodeURIComponent(product.name.charAt(0))}`; }}
                />
              </div>
              {discount && (
                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-black px-3 py-1 rounded-full shadow-sm">
                  {discount}% OFF
                </div>
              )}
              <button
                onClick={handleWishlist}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full border flex items-center justify-center shadow-sm transition-all ${
                  isWishlisted ? 'bg-primary border-primary text-white' : 'bg-white border-border/50 text-[#444] hover:border-primary/40 hover:text-primary'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
          </div>

          {/* ── PRODUCT INFO ── */}
          <div className="flex flex-col gap-5">

            {/* Category + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {category && <span className="badge badge-primary">{category}</span>}
              {product.status === 'PUBLISHED' && <span className="badge badge-success">In Stock</span>}
              {product.admin_note && <span className="badge badge-warning">🔥 {product.admin_note}</span>}
            </div>

            {/* Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] leading-tight">{product.name}</h1>

            {/* SKU */}
            {product.baseSku && (
              <p className="text-[10px] text-muted-foreground font-mono">SKU: {product.baseSku}</p>
            )}

            {/* Rating */}
            {avgRating && <StarDisplay rating={avgRating} count={product.reviews.length} />}

            {/* Divider */}
            <div className="h-px bg-border/60" />

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-[#1a1a1a]">₹{price.toFixed(0)}</span>
              {discount && (
                <>
                  <span className="text-lg text-muted-foreground line-through">₹{originalPrice.toFixed(0)}</span>
                  <span className="text-sm font-bold text-emerald-600">{discount}% OFF</span>
                </>
              )}
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Select Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map(v => {
                    const label = v.attributeValues?.Weight || v.attributeValues?.Size || v.sku;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedVariant?.id === v.id
                            ? 'border-primary bg-primary text-white'
                            : 'border-border text-[#333] hover:border-primary/60 hover:text-primary'
                        }`}
                      >
                        {label}
                        <span className="ml-1.5 opacity-75">₹{Number(v.price).toFixed(0)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center border border-border rounded-full overflow-hidden bg-[#f8f8f8]">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all font-bold text-lg"
                >−</button>
                <span className="min-w-[36px] text-center font-black text-[#1a1a1a] text-sm select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all font-bold text-lg"
                >+</button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 font-black py-3.5 rounded-full transition-all shadow-sm text-sm uppercase tracking-widest ${
                  addedAnim ? 'bg-emerald-500 text-white scale-95' : 'bg-primary hover:bg-black text-white hover:-translate-y-0.5 hover:shadow-lg'
                }`}
              >
                {addedAnim ? '✓ Added to Cart!' : 'Add to Cart'}
              </button>
            </div>

            {/* Trust mini-badges */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { icon: '🔒', label: 'Secure Payment' },
                { icon: '🚚', label: 'Free Shipping ₹2000+' },
                { icon: '↩️', label: 'Easy Returns' },
                { icon: '✅', label: '100% Authentic' },
              ].map(b => (
                <div key={b.label} className="flex items-center gap-2 p-2.5 bg-[#f8f8f8] rounded-xl border border-border/40">
                  <span className="text-sm">{b.icon}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS: Description / Reviews ── */}
        <div className="bg-white rounded-3xl border border-border/40 shadow-sm overflow-hidden mb-14">
          <div className="flex border-b border-border/40">
            {['description', 'reviews'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'text-primary border-b-2 border-primary bg-primary/4'
                    : 'text-muted-foreground hover:text-[#1a1a1a]'
                }`}
              >
                {tab}
                {tab === 'reviews' && product.reviews?.length > 0 && (
                  <span className="ml-2 badge badge-primary">{product.reviews.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            {activeTab === 'description' ? (
              <div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description || 'No description available for this product.'}
                </p>
                {product.baseSku && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: 'SKU',    value: product.baseSku },
                      { label: 'Brand',  value: product.brand?.name || '—' },
                      { label: 'Weight', value: product.weight ? `${product.weight}g` : '—' },
                      { label: 'GST',    value: `${product.gst || 18}%` },
                    ].map(d => (
                      <div key={d.label} className="p-3 bg-[#fafafa] rounded-xl border border-border/40">
                        <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">{d.label}</p>
                        <p className="text-xs font-semibold text-[#1a1a1a] mt-1">{d.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {product.reviews?.length > 0 ? (
                  <div className="space-y-4">
                    {product.reviews.map((review, i) => (
                      <div key={i} className="p-4 bg-[#fafafa] rounded-2xl border border-border/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-black flex items-center justify-center">
                              {(review.user?.firstName || review.userId || 'U')[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-[#1a1a1a]">
                              {review.user?.firstName || 'Customer'}
                            </span>
                          </div>
                          <StarDisplay rating={review.rating} count={0} />
                        </div>
                        {review.comment && <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <span className="text-4xl mb-3 block">⭐</span>
                    <p className="text-sm font-semibold text-[#1a1a1a]">No reviews yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Be the first to review this product.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RELATED PRODUCTS ── */}
        {related.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;
