import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStoreSettings } from '../api/admin';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [settings, setSettings] = useState({ shipping_fee: 50.00, free_shipping_threshold: 999.00 });

  useEffect(() => {
    getStoreSettings()
      .then(data => { if (data) setSettings(data); })
      .catch(() => {});
  }, []);

  const shippingFee = parseFloat(settings.shipping_fee ?? 50);
  const freeThreshold = parseFloat(settings.free_shipping_threshold ?? 999);
  const shipping = cartTotal >= freeThreshold ? 0 : shippingFee;
  const orderTotal = cartTotal + shipping;
  const progressPct = Math.min(100, (cartTotal / freeThreshold) * 100);

  // ── EMPTY STATE ──────────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="w-24 h-24 rounded-full bg-[#f8f4f0] border border-border/50 flex items-center justify-center mb-6 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-10 h-10 text-muted-foreground/60">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-black text-[#222] mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground text-sm font-medium mb-8 max-w-xs">
          You haven't added any sweets yet. Browse our collection and treat yourself!
        </p>
        <Link to="/products" className="bg-primary hover:bg-black text-white font-black px-8 py-3.5 rounded-full transition-all uppercase tracking-widest text-xs shadow-md hover:-translate-y-0.5">
          Browse Sweets
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">

      {/* Page Banner */}
      <div className="bg-gradient-to-br from-primary via-[#85161b] to-black text-white py-10 px-4 relative overflow-hidden mb-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,_white_1px,_transparent_1px)] bg-[length:30px_30px]" />
        <div className="container mx-auto relative z-10">
          <span className="text-[9px] font-black tracking-[0.35em] uppercase text-amber-400 mb-2 block">Your Cart</span>
          <h1 className="text-3xl md:text-4xl font-serif font-black leading-tight">
            {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in your bag
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── CART ITEMS ── */}
          <div className="flex-1 flex flex-col gap-4">

            {/* Free shipping progress */}
            {shipping > 0 && (
              <div className="bg-amber-50 border border-amber-200/70 rounded-2xl px-5 py-4 flex flex-col gap-2">
                <p className="text-xs font-bold text-amber-800">
                  Add <span className="font-black">₹{(freeThreshold - cartTotal).toFixed(2)}</span> more for <span className="text-emerald-600">FREE Shipping!</span>
                </p>
                <div className="w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
            )}
            {shipping === 0 && (
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl px-5 py-3.5 flex items-center gap-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 text-emerald-500 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <p className="text-xs font-bold text-emerald-700">🎉 You qualify for FREE shipping!</p>
              </div>
            )}

            {/* Items */}
            {cartItems.map(item => {
              const unitPrice = parseFloat(item.discount_price || item.price);
              const lineTotal = unitPrice * item.quantity;
              return (
                <div key={item.id} className="bg-white border border-border/50 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <Link to={`/products/${item.id}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#f8f4f0] border border-border/40">
                      <img
                        src={item.image_url || `https://placehold.co/80x80/f8f4f0/BA242A?text=${encodeURIComponent((item.name || '').split(' ')[0])}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.id}`}>
                      <h3 className="font-serif font-black text-sm text-[#222] hover:text-primary transition-colors truncate">{item.name}</h3>
                    </Link>
                    {item.category && (
                      <p className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/60 mt-0.5">{item.category}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-medium mt-1">₹{unitPrice.toFixed(2)} each</p>
                  </div>

                  {/* Qty Stepper */}
                  <div className="flex items-center border border-border rounded-full bg-[#f8f8f8] shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all rounded-l-full font-bold text-sm"
                    >−</button>
                    <span className="text-xs font-black text-[#222] min-w-[24px] text-center select-none">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-all rounded-r-full font-bold text-sm"
                    >+</button>
                  </div>

                  {/* Line total */}
                  <div className="text-right shrink-0 min-w-[80px]">
                    <p className="font-serif font-black text-base text-primary">₹{lineTotal.toFixed(2)}</p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black/4 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                    aria-label="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Clear cart */}
            <div className="flex justify-between items-center pt-2">
              <Link to="/products" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                Continue Shopping
              </Link>
              <button onClick={clearCart} className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                Clear Cart
              </button>
            </div>
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="w-full lg:w-[360px] shrink-0">
            <div className="bg-white border border-border/50 rounded-3xl p-7 sticky top-28 shadow-sm">

              {/* Header */}
              <div className="flex items-center gap-2 mb-6 pb-5 border-b border-border/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px w-8 bg-primary"></div>
                  <span className="text-[9px] font-black tracking-[0.4em] uppercase text-primary">Checkout</span>
                </div>
                <h2 className="sr-only">Order Summary</h2>
              </div>
              <h3 className="text-xl font-serif font-black text-[#222] mb-5 -mt-3">Order Summary</h3>

              {/* Line items */}
              <div className="flex flex-col gap-3 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold text-[#222]">₹{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Shipping</span>
                  <span className={`font-bold ${shipping === 0 ? 'text-emerald-500' : 'text-[#222]'}`}>
                    {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Free shipping nudge */}
              {shipping > 0 && (
                <div className="bg-[#f9f5f0] rounded-xl px-4 py-3 mb-5 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 mb-1.5">
                    ₹{(freeThreshold - cartTotal).toFixed(2)} away from free shipping
                  </p>
                  <div className="w-full bg-amber-100 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-border/50 pt-4 mb-6 flex justify-between items-baseline">
                <span className="text-sm font-black text-[#222] uppercase tracking-wider">Total</span>
                <span className="text-2xl font-serif font-black text-primary">₹{orderTotal.toFixed(2)}</span>
              </div>

              {/* CTA */}
              <Link
                to="/checkout"
                className="block w-full bg-primary hover:bg-black text-white text-center font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-md hover:-translate-y-0.5"
              >
                Proceed to Checkout →
              </Link>

              {/* Trust signals */}
              <div className="mt-5 flex flex-col gap-2 pt-4 border-t border-border/30">
                {[
                  { icon: '🔒', text: 'Secure & encrypted checkout' },
                  { icon: '🚚', text: `Free delivery above ₹${freeThreshold.toFixed(0)}` },
                  { icon: '↩️', text: 'Easy returns & refunds' },
                ].map(t => (
                  <div key={t.text} className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                    <span>{t.icon}</span>
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CartPage;
