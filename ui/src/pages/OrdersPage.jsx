import { useState, useEffect } from 'react';
import { getMyOrders } from '../api/orders';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    color: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-400' },
  shipped:    { label: 'Shipped',    color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  delivered:  { label: 'Delivered',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-500' },
};

const TRACKING_STEPS = [
  {
    key: 'confirmed',
    label: 'Order Confirmed',
    desc: 'Your order has been received and logged in our system.',
    activeFor: ['pending', 'processing', 'shipped', 'delivered'],
  },
  {
    key: 'preparing',
    label: 'Preparing in Kitchen',
    desc: 'Our chefs in Ravulapalem are crafting your sweets with pure ghee.',
    activeFor: ['processing', 'shipped', 'delivered'],
  },
  {
    key: 'sealed',
    label: 'Freshness & Seal Verified',
    desc: 'Quality inspection, hygiene validation and vacuum sealing complete.',
    activeFor: ['shipped', 'delivered'],
  },
  {
    key: 'shipped',
    label: 'Dispatched / En Route',
    desc: 'Handed over to the courier for doorstep delivery.',
    activeFor: ['shipped', 'delivered'],
  },
  {
    key: 'delivered',
    label: 'Delivered Successfully',
    desc: 'Sweets delivered in prime condition. Enjoy the authentic taste of Konaseema!',
    activeFor: ['delivered'],
    isSuccess: true,
  },
];

const OrdersPage = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchOrders = async () => {
      try {
        const res = await getMyOrders(1, 100);
        // Map backend objects to expected UI structure
        const mapped = (res?.items || []).map(order => ({
          ...order,
          created_at: order.createdAt,
          total_amount: order.totalAmount,
          status: order.status.toLowerCase(),
          order_items: (order.items || []).map(item => ({
            ...item,
            price_at_time: item.unitPrice,
            products: {
              name: item.name,
              image_url: item.variant?.product?.images?.[0]?.url || null
            }
          }))
        }));
        setOrders(mapped);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const statusCfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="bg-gradient-to-br from-primary via-[#85161b] to-black text-white py-10 px-4 mb-10">
          <div className="container mx-auto">
            <div className="h-4 w-24 bg-white/20 rounded-full mb-3 animate-pulse" />
            <div className="h-8 w-48 bg-white/20 rounded-xl animate-pulse" />
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-8 flex flex-col gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-black/5 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  // ── EMPTY ──
  if (orders.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <div className="bg-gradient-to-br from-primary via-[#85161b] to-black text-white py-10 px-4 relative overflow-hidden mb-10">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,_white_1px,_transparent_1px)] bg-[length:30px_30px]" />
          <div className="container mx-auto relative z-10">
            <span className="text-[9px] font-black tracking-[0.35em] uppercase text-amber-400 mb-2 block">My Account</span>
            <h1 className="text-3xl md:text-4xl font-serif font-black">Order History</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[#f8f4f0] border border-border/50 flex items-center justify-center mb-5 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-9 h-9 text-muted-foreground/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </div>
          <h2 className="text-xl font-serif font-black text-[#222] mb-2">No orders yet</h2>
          <p className="text-sm text-muted-foreground font-medium mb-8">You haven't placed any orders. Start shopping!</p>
          <Link to="/products" className="bg-primary hover:bg-black text-white font-black px-8 py-3.5 rounded-full transition-all uppercase tracking-widest text-xs shadow-md hover:-translate-y-0.5">
            Browse Sweets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">

      {/* ── Page Banner ── */}
      <div className="bg-gradient-to-br from-primary via-[#85161b] to-black text-white py-10 px-4 relative overflow-hidden mb-10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,_white_1px,_transparent_1px)] bg-[length:30px_30px]" />
        <div className="container mx-auto relative z-10 flex items-end justify-between">
          <div>
            <span className="text-[9px] font-black tracking-[0.35em] uppercase text-amber-400 mb-2 block">My Account</span>
            <h1 className="text-3xl md:text-4xl font-serif font-black leading-tight">Order History</h1>
          </div>
          <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/20 text-white/80">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 flex flex-col gap-5">
        {orders.map(order => {
          const cfg = statusCfg(order.status);
          const isExpanded = expandedOrder === order.id;
          const shortId = order.id.split('-')[0].toUpperCase();
          const orderDate = new Date(order.created_at);

          return (
            <div key={order.id} className="bg-white border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

              {/* ── Order Header ── */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/30">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${order.status === 'processing' ? 'animate-pulse' : ''}`}></span>
                    {cfg.label}
                  </span>

                  {/* Order ID */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Order</span>
                    <span className="text-xs font-black text-[#222] font-mono">#{shortId}</span>
                  </div>

                  {/* Date */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Placed On</span>
                    <span className="text-xs font-bold text-[#333]">{orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Total */}
                  <div className="flex flex-col leading-none">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Total</span>
                    <span className="text-sm font-serif font-black text-primary">₹{parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => setTrackingOrder(order)}
                      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-amber-400 hover:bg-amber-300 text-black px-3.5 py-2 rounded-full transition-all hover:scale-105 shadow-sm"
                    >
                      📍 Track Order
                    </button>
                  )}
                  <button
                    onClick={() => window.open('/print/invoice/' + order.id, '_blank')}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[#333] px-3.5 py-2 rounded-full transition-all"
                  >
                    🧾 Invoice
                  </button>
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors px-2 py-2"
                  >
                    {isExpanded ? '▲ Hide' : '▼ Items'}
                  </button>
                </div>
              </div>

              {/* ── Admin Note ── */}
              {order.admin_note && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-3 flex items-start gap-2.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                  <p className="text-xs text-amber-800 font-semibold leading-snug"><strong>Note from store:</strong> {order.admin_note}</p>
                </div>
              )}

              {/* ── Items — Collapsed Preview ── */}
              {!isExpanded && (
                <div className="px-5 py-3 flex items-center gap-2">
                  <div className="flex items-center -space-x-2">
                    {(order.order_items || []).slice(0, 4).map((item, idx) => (
                      <div key={idx} className="w-9 h-9 rounded-full border-2 border-white overflow-hidden bg-[#f8f4f0] shrink-0">
                        <img
                          src={item.products?.image_url || `https://placehold.co/36x36/f8f4f0/BA242A?text=${encodeURIComponent((item.products?.name || 'P').charAt(0))}`}
                          alt={item.products?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {(order.order_items || []).length > 4 && (
                      <div className="w-9 h-9 rounded-full border-2 border-white bg-[#f0f0f0] flex items-center justify-center text-[9px] font-black text-muted-foreground shrink-0">
                        +{order.order_items.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
                    {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* ── Items — Expanded ── */}
              {isExpanded && (
                <div className="px-5 py-4 flex flex-col gap-3">
                  {(order.order_items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-none">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#f8f4f0] border border-border/30 shrink-0">
                        <img
                          src={item.products?.image_url || `https://placehold.co/48x48/f8f4f0/BA242A?text=${encodeURIComponent((item.products?.name || 'P').charAt(0))}`}
                          alt={item.products?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-serif font-black text-[#222] truncate">{item.products?.name}</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground font-medium">Qty: {item.quantity}</p>
                        <p className="text-sm font-serif font-black text-primary">₹{(parseFloat(item.price_at_time) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── TRACKING SIDE DRAWER ── */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTrackingOrder(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col z-10 overflow-y-auto animate-slide-in">

            {/* Drawer header */}
            <div className="bg-gradient-to-br from-[#0f0505] via-primary to-[#6e0f13] text-white px-6 py-6 shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-black tracking-[0.4em] uppercase text-amber-400 mb-1 block">Live Tracking</span>
                  <h2 className="text-xl font-serif font-black">Order #{trackingOrder.id.split('-')[0].toUpperCase()}</h2>
                  <p className="text-xs text-white/60 font-medium mt-1">
                    Placed {new Date(trackingOrder.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Status pill */}
              <div className="relative z-10 mt-4">
                <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${statusCfg(trackingOrder.status).color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg(trackingOrder.status).dot}`}></span>
                  {statusCfg(trackingOrder.status).label}
                </span>
              </div>
            </div>

            {/* Delivery status card */}
            <div className="mx-5 mt-5 bg-amber-50 border border-amber-200/60 rounded-2xl p-4">
              <p className="text-[9px] font-black tracking-widest uppercase text-amber-600 mb-1">Ghee Express Status</p>
              <p className="text-sm font-serif font-black text-[#222]">
                {trackingOrder.status === 'delivered' ? '🎉 Sweets Delivered!' : '🚚 En Route from Godavari Kitchens'}
              </p>
              <p className="text-xs text-amber-800/70 font-medium leading-relaxed mt-1">
                {trackingOrder.status === 'delivered'
                  ? 'Your pure-ghee confections have been delivered. Enjoy the authentic taste!'
                  : 'Your confections are being prepared and vacuum-sealed for dispatch within 24 hours.'}
              </p>
            </div>

            {/* Timeline stepper */}
            <div className="px-6 py-6 flex flex-col gap-0">
              {TRACKING_STEPS.map((step, idx) => {
                const isActive = step.activeFor.includes(trackingOrder.status);
                const isLast = idx === TRACKING_STEPS.length - 1;
                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Dot + line */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 shrink-0 mt-0.5 ${
                        isActive
                          ? step.isSuccess
                            ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                            : 'bg-amber-400 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                          : 'bg-white border-border'
                      } ${isActive && !step.isSuccess && trackingOrder.status !== 'shipped' && trackingOrder.status !== 'delivered' ? 'animate-pulse' : ''}`} />
                      {!isLast && <div className={`w-0.5 flex-1 mt-1 mb-1 rounded-full transition-all duration-500 ${isActive ? 'bg-amber-300' : 'bg-border'}`} style={{ minHeight: '28px' }} />}
                    </div>

                    {/* Content */}
                    <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                      <h4 className={`text-sm font-black transition-colors duration-300 ${isActive ? step.isSuccess ? 'text-emerald-600' : 'text-[#222]' : 'text-muted-foreground/50'}`}>
                        {step.label}
                      </h4>
                      <p className={`text-xs leading-relaxed mt-0.5 transition-colors duration-300 ${isActive ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                        {step.desc}
                      </p>
                      {idx === 0 && isActive && (
                        <p className="text-[9px] font-bold text-amber-500 font-mono mt-1">
                          {new Date(trackingOrder.created_at).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mx-5 mb-6 bg-[#f9f5f0] rounded-2xl px-4 py-4 border border-border/30">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Need Help?</p>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Contact us for any queries about your order. We're here to help!
              </p>
              <a href="tel:+919988776655" className="mt-3 flex items-center gap-2 text-xs font-bold text-primary hover:text-black transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                Call Customer Support
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
