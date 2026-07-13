import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getWishlist, removeFromWishlist as removeFromWishlistApi } from '../api/cart';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const data = await getWishlist();
        const mapped = data.map(item => ({
          ...item.variant?.product,
          price: Number(item.variant?.price),
          image_url: item.variant?.product?.images?.[0]?.url || null,
          category: item.variant?.product?.categories?.[0]?.category?.name || '',
          variantId: item.variantId
        })).filter(Boolean);
        setWishlistItems(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user]);

  const removeFromWishlist = async (productId) => {
    const item = wishlistItems.find(i => i.id === productId);
    const variantId = item?.variantId;
    if (!variantId) return;
    try {
      await removeFromWishlistApi(variantId);
      setWishlistItems(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Page Banner */}
      <div className="bg-gradient-to-r from-[#f9f5f0] to-[#fdf8f3] border-b border-border/40 py-10 px-4">
        <div className="container mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-2 block">Your Collection</span>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-[#222]">My Wishlist</h1>
          </div>
          {!loading && (
            <span className="text-sm font-bold text-muted-foreground bg-black/5 px-4 py-2 rounded-full border border-border/40">
              {wishlistItems.length} saved item{wishlistItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-10">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[380px] bg-black/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-24">
            <span className="text-5xl mb-4 block">💛</span>
            <h2 className="text-2xl font-serif font-black text-[#222] mb-2">Sign in to view your wishlist</h2>
            <p className="text-muted-foreground text-sm font-medium mb-8">Save your favourite Godavari sweets and revisit them anytime.</p>
            <Link to="/login" className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-black transition-all uppercase tracking-wider text-xs shadow-md">
              Sign In
            </Link>
          </div>
        ) : wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map(product => (
              <div key={product.id} className="relative">
                <ProductCard product={product} />
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white border border-border/50 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 hover:border-red-200 transition-all"
                  title="Remove from wishlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-400">
                    <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-black/[0.02] rounded-3xl border border-border/30">
            <span className="text-5xl mb-4 block">🛍️</span>
            <h2 className="text-2xl font-serif font-black text-[#222] mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground text-sm font-medium mb-8">Explore our premium collection and save items you love.</p>
            <Link to="/products" className="bg-primary text-white font-bold py-3 px-8 rounded-full hover:bg-black transition-all uppercase tracking-wider text-xs shadow-md">
              Browse Products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
