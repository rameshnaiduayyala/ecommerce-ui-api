import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getOrderDetails } from '../api/orders';
import { getStoreSettings } from '../api/admin';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PrintInvoice = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState({
    store_name: 'Aha Konaseema',
    origin_address: 'Ravulapalem, East Godavari District, Andhra Pradesh',
    courier_partner: 'Ghee Express Courier',
    support_email: 'admin@rameshayyala.online',
    support_phone: '+91 888 777 6666',
    guarantee_text: 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached'
  });
  const [loading, setLoading] = useState(true);

  useDocumentTitle(order ? `Invoice #${order.id.toUpperCase()}` : 'Generating Purchase Invoice...');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch order details from API
        const orderData = await getOrderDetails(orderId);
        const mappedOrder = {
          ...orderData,
          created_at: orderData.createdAt,
          total_amount: Number(orderData.totalAmount),
          shipping_address: orderData.shippingAddress ? {
            firstName: orderData.shippingAddress.firstName,
            lastName: orderData.shippingAddress.lastName,
            address: orderData.shippingAddress.addressLine1,
            city: orderData.shippingAddress.city,
            postalCode: orderData.shippingAddress.postalCode,
            country: orderData.shippingAddress.country,
            phone: orderData.shippingAddress.phone
          } : null,
          order_items: (orderData.items || []).map(item => ({
            quantity: item.quantity,
            price_at_time: Number(item.unitPrice),
            products: {
              name: item.name
            }
          }))
        };
        setOrder(mappedOrder);

        // Fetch store settings from API
        const settingsData = await getStoreSettings();
        if (settingsData) {
          setSettings(prev => ({ ...prev, ...settingsData }));
        }
      } catch (err) {
        console.error("Error loading print details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // Auto trigger print when loading finishes
  useEffect(() => {
    if (!loading && order) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-sm tracking-widest text-amber-500 font-bold uppercase animate-pulse">
          Generating Purchase Invoice...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-4 text-center">
        <h2 className="text-2xl font-black text-destructive">Purchase Invoice Not Found</h2>
        <p className="text-muted-foreground text-sm max-w-md">Verify the order reference ID or contact support.</p>
        <button
          onClick={() => window.close()}
          className="bg-black/5 hover:bg-black/10 border border-border px-6 py-2.5 rounded-full text-xs font-bold transition-all text-foreground mt-2"
        >
          Close Print View
        </button>
      </div>
    );
  }

  const printStoreName = settings.store_name || 'Aha Konaseema';
  const printOriginAddress = settings.origin_address || 'Ravulapalem, East Godavari District, Andhra Pradesh';
  const printCourierPartner = settings.courier_partner || 'Ghee Express Courier';
  const printSupportEmail = settings.support_email || 'admin@rameshayyala.online';
  const printSupportPhone = settings.support_phone || '+91 888 777 6666';
  const printGuaranteeText = settings.guarantee_text || 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached';
  const guaranteeItems = printGuaranteeText.split('•').map(s => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans antialiased">
      {/* Floating Action Controls (Hidden on Print) */}
      <div className="max-w-3xl mx-auto mb-8 bg-neutral-900 text-foreground rounded-2xl p-4 flex justify-between items-center shadow-lg border border-neutral-800 print:hidden">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Invoice Mode</span>
          <span className="text-sm font-black">Official Purchase Receipt</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            🖨️ Print Receipt
          </button>
          <button
            onClick={() => window.close()}
            className="bg-neutral-800 hover:bg-neutral-700 text-foreground font-bold text-xs px-5 py-2.5 rounded-xl border border-neutral-700 transition-all"
          >
            Close Tab
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-3xl mx-auto bg-white border border-neutral-200 p-8 rounded-2xl print:border-none print:p-0">
        {/* Receipt Header */}
        <div className="flex justify-between items-start border-b border-black/10 pb-6">
          <div>
            <h2 className="text-3xl font-black text-black font-sans tracking-tight">
              {printStoreName.toUpperCase()}
            </h2>
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mt-1">Official Purchase Invoice Receipt</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-black bg-neutral-100 px-3 py-1.5 rounded-md print:bg-transparent print:p-0">
              RECEIPT ID: #{order.id.toUpperCase()}
            </span>
            <p className="text-[10px] text-neutral-500 mt-2">
              Purchase Date: {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Delivery and Support Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-black/10 text-xs">
          <div>
            <h4 className="font-black text-black uppercase tracking-wider mb-2 text-[10px] text-neutral-400">Delivered To</h4>
            <div className="flex flex-col gap-1 text-neutral-800 font-medium">
              <span className="font-black text-black text-sm">
                {order.shipping_address?.firstName} {order.shipping_address?.lastName}
              </span>
              <span>{order.shipping_address?.address}</span>
              <span>{order.shipping_address?.city}, {order.shipping_address?.postalCode}</span>
              <span>{order.shipping_address?.country || 'India'}</span>
              {order.shipping_address?.phone && <span className="mt-1 font-mono text-black">📞 {order.shipping_address?.phone}</span>}
            </div>
          </div>
          <div>
            <h4 className="font-black text-black uppercase tracking-wider mb-2 text-[10px] text-neutral-400">Store Support Details</h4>
            <div className="flex flex-col gap-1 text-neutral-800 font-medium">
              <span><strong>Carrier Partner:</strong> {printCourierPartner}</span>
              <span><strong>Dispatch Kitchen:</strong> {printOriginAddress}</span>
              <span><strong>Support Email:</strong> {printSupportEmail}</span>
              <span><strong>Support Contact Phone:</strong> {printSupportPhone}</span>
            </div>
          </div>
        </div>

        {/* Purchased Confections Table */}
        <div className="py-6 border-b border-black/10">
          <h4 className="font-black text-black uppercase tracking-wider text-[10px] text-neutral-400 mb-4">Purchased Confections</h4>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/20 text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5">Confection Item</th>
                <th className="py-2.5 text-center">Quantity</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items?.map((item, idx) => (
                <tr key={idx} className="border-b border-black/5 text-neutral-800">
                  <td className="py-3 font-bold text-black">{item.products?.name}</td>
                  <td className="py-3 text-center font-bold text-black">{item.quantity}</td>
                  <td className="py-3 text-right">₹{item.price_at_time}</td>
                  <td className="py-3 text-right font-bold text-black">₹{item.quantity * item.price_at_time}</td>
                </tr>
              ))}
              <tr className="text-black font-bold">
                <td colSpan="3" className="py-4 text-right uppercase font-black text-[10px]">Grand Payment Total</td>
                <td className="py-4 text-right text-base font-black text-amber-600 print:text-black">₹{order.total_amount}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Quality Seal Checklist */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex flex-col gap-3 mt-6">
          <span className="text-[10px] text-black font-black uppercase tracking-widest flex items-center gap-1.5">
            🛡️ {printStoreName.toUpperCase()} QUALITY GUARANTEE ASSURANCES
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] text-neutral-800 font-medium">
            {guaranteeItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-emerald-600 font-extrabold text-sm">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] text-neutral-400 mt-12 font-mono">
          <span>* Thank you for your support! We look forward to sweetening your celebrations again soon. *</span>
        </div>
      </div>
    </div>
  );
};

export default PrintInvoice;
