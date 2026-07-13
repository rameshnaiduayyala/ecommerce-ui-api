import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStoreSettings, validateCoupon } from '../api/admin';
import { getAddresses, createAddress } from '../api/auth';
import { placeOrder } from '../api/orders';
import { EmailTemplates } from '../notifications/emailService';
import { pushService } from '../notifications/pushService';
import { useCurrency } from '../context/CurrencyContext';

const InputField = ({ label, name, value, onChange, placeholder = '', type = 'text', required = true, colSpan = false, mono = false }) => (
  <div className={`flex flex-col gap-1.5 ${colSpan ? 'col-span-2' : ''}`}>
    <label className="text-[9px] font-black tracking-[0.3em] uppercase text-muted-foreground">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`border border-border rounded-xl px-4 py-3 text-sm bg-[#fafafa] focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-muted-foreground/40 ${mono ? 'font-mono tracking-wider' : 'font-medium'}`}
    />
  </div>
);

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart, cartId } = useCart();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '',
    address: '', city: '', postalCode: '', state: '', country: 'India',
    cardNumber: '', expiry: '', cvc: ''
  });

  const [settings, setSettings] = useState({ cod_enabled: true, partial_payment_enabled: false, partial_payment_percent: 50, shipping_fee: 50, free_shipping_threshold: 999 });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [step, setStep] = useState(1); // 1 = Address, 2 = Payment
  const [idempotencyKey] = useState(() => {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return `key-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }
  });

  useEffect(() => {
    getStoreSettings().then(data => { if (data) setSettings(data); }).catch(() => {});

    if (user) {
      getAddresses().then(addresses => {
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) {
          setFormData(prev => ({
            ...prev,
            firstName: defaultAddr.firstName || prev.firstName,
            lastName: defaultAddr.lastName || prev.lastName,
            phone: defaultAddr.phone || prev.phone,
            address: defaultAddr.addressLine1 || prev.address,
            city: defaultAddr.city || prev.city,
            postalCode: defaultAddr.postalCode || prev.postalCode,
            state: defaultAddr.state || prev.state,
            country: defaultAddr.country || 'India',
          }));
        } else {
          // Prefill from user
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName || prev.firstName,
            lastName: user.lastName || prev.lastName,
            phone: user.phone || prev.phone,
          }));
        }
      }).catch(() => {});
    }
  }, [user]);

  // Payment method default: prefer COD, else full
  useEffect(() => {
    if (settings.cod_enabled) setPaymentMethod('cod');
    else setPaymentMethod('full');
  }, [settings.cod_enabled]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const shippingFee = parseFloat(settings.shipping_fee ?? 50);
  const freeThreshold = parseFloat(settings.free_shipping_threshold ?? 999);
  const shipping = cartTotal >= freeThreshold ? 0 : shippingFee;

  const discountAmount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discount_type === 'percentage'
      ? cartTotal * (appliedCoupon.discount_value / 100)
      : Math.min(appliedCoupon.discount_value, cartTotal);
  };

  const grandTotal = Math.max(0, cartTotal - discountAmount() + shipping);
  const dueTodayAmount = paymentMethod === 'partial'
    ? grandTotal * ((settings.partial_payment_percent || 50) / 100)
    : grandTotal;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError(''); setCouponSuccess('');
    if (!couponCode) return;
    try {
      const coupon = await validateCoupon(couponCode, cartTotal);
      if (!coupon) { setCouponError('Invalid or expired coupon code.'); return; }
      if (cartTotal < coupon.min_order_value) { setCouponError(`Minimum order ₹${coupon.min_order_value} required.`); return; }
      setAppliedCoupon(coupon);
      setCouponSuccess(`"${coupon.code}" applied — you saved ₹${discountAmount().toFixed(2)}!`);
    } catch { setCouponError('Invalid or expired coupon code.'); }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!user) { alert('Please log in to checkout.'); return navigate('/login'); }
    if (!cartId) { alert('Invalid shopping session.'); return; }
    setIsProcessing(true);
    try {
      // 1. Create or save the shipping address on the backend to get a shippingAddressId
      const addressObj = {
        addressName: "Shipping Address",
        firstName: formData.firstName || 'User',
        lastName: formData.lastName || 'User',
        phone: formData.phone,
        addressLine1: formData.address,
        city: formData.city,
        state: formData.state || 'Andhra Pradesh',
        country: formData.country || 'India',
        postalCode: formData.postalCode,
        isDefault: false
      };
      const newAddress = await createAddress(addressObj);
      if (!newAddress?.id) throw new Error("Failed to save shipping address.");

      // 2. Place order via REST API
      const orderData = await placeOrder({
        cartId,
        couponCode: appliedCoupon?.code || null,
        shippingAddressId: newAddress.id,
        paymentMethod: paymentMethod === 'cod' ? 'COD' : paymentMethod === 'partial' ? 'WALLET' : 'STRIPE',
        currency,
        idempotencyKey
      });

      if (!orderData?.id) throw new Error("Failed to place order.");

      try {
        const orderDetails = {
          orderId: orderData.id,
          date: orderData.createdAt || new Date().toISOString(),
          customerName: `${formData.firstName} ${formData.lastName}`,
          shippingAddress: `${formData.address}, ${formData.city}, ${formData.postalCode}, ${formData.country}`,
          phone: formData.phone || '',
          items: cartItems, subtotal: cartTotal, discount: discountAmount(), shipping, grandTotal: dueTodayAmount,
          paymentMethod: paymentMethod === 'full' ? 'Prepaid (Full)' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Partial Payment',
          origin: window.location.origin
        };
        await EmailTemplates.sendOrderConfirmation(user.email, orderDetails);
        const adminEmail = settings.support_email || 'admin@rameshayyala.online';
        await EmailTemplates.sendAdminNewOrderAlert(adminEmail, orderDetails);
        try {
          await pushService.sendPushNotification({ userId: user.id, title: 'Order Placed! 🛍️', message: `Order #${orderData.id.slice(0,8).toUpperCase()} placed!`, url: `${window.location.origin}/orders` });
        } catch {}
        try {
          await pushService.sendPushNotification({ userId: 'admin', title: '🚨 New Order!', message: `Order #${orderData.id.slice(0,8).toUpperCase()} for ₹${dueTodayAmount.toFixed(0)}`, url: `${window.location.origin}/admin` });
        } catch {}
      } catch (emailErr) { console.warn('Email/push failed (non-blocking):', emailErr); }

      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Checkout failed:', err);
      alert(err.message || 'Checkout failed. Please try again.');
    } finally { setIsProcessing(false); }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-20">
        <h2 className="text-2xl font-serif font-black text-[#222] mb-3">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm mb-8">Add some sweets before checking out.</p>
        <button onClick={() => navigate('/products')} className="bg-primary hover:bg-black text-white font-black px-8 py-3.5 rounded-full transition-all uppercase tracking-widest text-xs shadow-md">
          Browse Sweets
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">

      {/* ── Page Banner ── */}
      <div className="bg-gradient-to-br from-primary via-[#85161b] to-black text-white py-10 px-4 relative overflow-hidden mb-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,_white_1px,_transparent_1px)] bg-[length:30px_30px]" />
        <div className="container mx-auto relative z-10">
          <span className="text-[9px] font-black tracking-[0.35em] uppercase text-amber-400 mb-2 block">Secure Checkout</span>
          <h1 className="text-3xl md:text-4xl font-serif font-black leading-tight">Complete Your Order</h1>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mt-4">
            {['Delivery Address', 'Payment'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${step > i + 1 ? 'bg-emerald-400 text-white' : step === i + 1 ? 'bg-amber-400 text-black' : 'bg-white/15 text-white/50'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider ${step === i + 1 ? 'text-amber-400' : 'text-white/40'}`}>{s}</span>
                {i < 1 && <div className="w-8 h-px bg-white/20 ml-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <form onSubmit={handleCheckout}>
          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* ── LEFT: Steps ── */}
            <div className="flex-1 flex flex-col gap-6">

              {/* STEP 1 — Shipping Address */}
              <div className="bg-white border border-border/50 rounded-3xl p-7 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">1</div>
                    <div>
                      <h2 className="text-base font-serif font-black text-[#222]">Delivery Address</h2>
                      <p className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">Where should we deliver?</p>
                    </div>
                  </div>
                  {user && <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">Auto-filled from profile</span>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                  <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
                  <InputField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" type="tel" colSpan />
                  <InputField label="Street Address" name="address" value={formData.address} onChange={handleChange} placeholder="House / Flat No, Street, Area" colSpan />
                  <InputField label="City" name="city" value={formData.city} onChange={handleChange} />
                  <InputField label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} mono />
                  <InputField label="State" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Andhra Pradesh" />
                  <InputField label="Country" name="country" value={formData.country} onChange={handleChange} />
                </div>
              </div>

              {/* STEP 2 — Payment */}
              <div className="bg-white border border-border/50 rounded-3xl p-7 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h2 className="text-base font-serif font-black text-[#222]">Payment Method</h2>
                    <p className="text-[9px] text-muted-foreground font-medium tracking-wider uppercase">How would you like to pay?</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  {/* Full pay */}
                  <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                    <input type="radio" name="paymentMethod" value="full" checked={paymentMethod === 'full'} onChange={e => setPaymentMethod(e.target.value)} className="accent-primary w-4 h-4" />
                    <div className="flex-1">
                      <p className="text-sm font-black text-[#222]">Pay in Full</p>
                      <p className="text-[10px] text-muted-foreground font-medium">Credit / Debit card payment</p>
                    </div>
                    <span className="text-lg">💳</span>
                  </label>

                  {settings.cod_enabled && (
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <input type="radio" name="paymentMethod" value="cod" checked={paymentMethod === 'cod'} onChange={e => setPaymentMethod(e.target.value)} className="accent-primary w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm font-black text-[#222]">Cash on Delivery</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Pay when your order arrives</p>
                      </div>
                      <span className="text-lg">💵</span>
                    </label>
                  )}

                  {settings.partial_payment_enabled && (
                    <label className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${paymentMethod === 'partial' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      <input type="radio" name="paymentMethod" value="partial" checked={paymentMethod === 'partial'} onChange={e => setPaymentMethod(e.target.value)} className="accent-primary w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm font-black text-[#222]">Pay {settings.partial_payment_percent}% Upfront</p>
                        <p className="text-[10px] text-muted-foreground font-medium">Pay rest on delivery</p>
                      </div>
                      <span className="text-lg">🔀</span>
                    </label>
                  )}
                </div>

                {/* Card fields — only for non-COD */}
                {paymentMethod !== 'cod' && (
                  <div className="flex flex-col gap-4 pt-4 border-t border-border/40">
                    <p className="text-[9px] font-black tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                      <span>🔒</span> Card Details — SSL Encrypted
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black tracking-[0.3em] uppercase text-muted-foreground">Card Number</label>
                      <input name="cardNumber" value={formData.cardNumber} onChange={handleChange} placeholder="0000 0000 0000 0000" required className="border border-border rounded-xl px-4 py-3 text-sm bg-[#fafafa] focus:outline-none focus:border-primary transition-all font-mono tracking-widest" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-muted-foreground">Expiry Date</label>
                        <input name="expiry" value={formData.expiry} onChange={handleChange} placeholder="MM / YY" required className="border border-border rounded-xl px-4 py-3 text-sm bg-[#fafafa] focus:outline-none focus:border-primary transition-all font-mono" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black tracking-[0.3em] uppercase text-muted-foreground">CVC</label>
                        <input name="cvc" value={formData.cvc} onChange={handleChange} placeholder="•••" type="password" maxLength={4} required className="border border-border rounded-xl px-4 py-3 text-sm bg-[#fafafa] focus:outline-none focus:border-primary transition-all font-mono" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Place Order CTA (mobile only) */}
              <button
                type="submit"
                disabled={isProcessing}
                className="lg:hidden w-full bg-primary hover:bg-black text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing…</>
                ) : `Place Order — ${formatPrice(dueTodayAmount)}`}
              </button>
            </div>

            {/* ── RIGHT: Order Summary ── */}
            <div className="w-full lg:w-[360px] shrink-0">
              <div className="bg-white border border-border/50 rounded-3xl p-7 sticky top-28 shadow-sm flex flex-col gap-5">

                {/* Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-px w-6 bg-primary"></div>
                    <span className="text-[9px] font-black tracking-[0.4em] uppercase text-primary">Summary</span>
                  </div>
                  <h3 className="text-lg font-serif font-black text-[#222]">Order Summary</h3>
                </div>

                {/* Items list */}
                <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                  {cartItems.map(item => {
                    const price = parseFloat(item.discount_price || item.price);
                    return (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img src={item.image_url || `https://placehold.co/40x40/f8f4f0/BA242A?text=${encodeURIComponent((item.name||'').split(' ')[0])}`} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-[#f8f4f0] border border-border/30" />
                          <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">{item.quantity}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#333] flex-1 line-clamp-1">{item.name}</span>
                        <span className="text-xs font-black text-[#222] shrink-0">{formatPrice(price * item.quantity)}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon input */}
                <div className="border-t border-border/40 pt-4">
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text" placeholder="PROMO CODE"
                      value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 border border-border rounded-xl px-3 py-2.5 text-xs bg-[#fafafa] focus:outline-none focus:border-primary transition-all font-mono font-bold uppercase"
                    />
                    <button type="submit" className="bg-[#222] hover:bg-primary text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shrink-0">Apply</button>
                  </form>
                  {couponError && <p className="text-red-500 text-[10px] font-bold mt-1.5">{couponError}</p>}
                  {couponSuccess && <p className="text-emerald-600 text-[10px] font-bold mt-1.5">{couponSuccess}</p>}
                </div>

                {/* Price breakdown */}
                <div className="flex flex-col gap-2.5 border-t border-border/40 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold text-[#222]">{formatPrice(cartTotal)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 font-bold">Discount ({appliedCoupon.code})</span>
                      <span className="text-emerald-600 font-bold">−{formatPrice(discountAmount())}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">Shipping</span>
                    <span className={`font-bold ${shipping === 0 ? 'text-emerald-500' : 'text-[#222]'}`}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  {paymentMethod === 'partial' && (
                    <div className="flex justify-between text-sm text-primary font-bold">
                      <span>Upfront ({settings.partial_payment_percent}%)</span>
                      <span>{formatPrice(dueTodayAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="border-t border-border/50 pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-black text-[#222] uppercase tracking-wider">
                    {paymentMethod === 'cod' ? 'Due on Delivery' : paymentMethod === 'partial' ? 'Due Today' : 'Total'}
                  </span>
                  <span className="text-2xl font-serif font-black text-primary">{formatPrice(dueTodayAmount)}</span>
                </div>

                {/* CTA — desktop */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="hidden lg:flex w-full items-center justify-center gap-2 bg-primary hover:bg-black text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Processing…</>
                  ) : `Place Order — ${formatPrice(dueTodayAmount)}`}
                </button>

                {/* Trust signals */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-border/30">
                  {[{ icon: '🔒', t: 'SSL encrypted secure checkout' }, { icon: '📦', t: 'Freshness guaranteed on delivery' }, { icon: '↩️', t: 'Easy return & refund policy' }].map(b => (
                    <div key={b.t} className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                      <span>{b.icon}</span><span>{b.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
