import React, { useState } from 'react';

const CouponManager = ({
  coupons = [],
  addCoupon,
  deleteCoupon,
  toggleCoupon,
  loadData
}) => {
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: 0, is_active: true });
  const [couponStatus, setCouponStatus] = useState('');

  const handleCouponToggle = async (code, currentActive) => {
    try {
      await toggleCoupon(code, !currentActive);
      loadData();
    } catch (err) {
      alert("Failed to toggle status.");
    }
  };

  const handleCouponDelete = async (code) => {
    if (!window.confirm("Delete this coupon code?")) return;
    try {
      await deleteCoupon(code);
      loadData();
    } catch (err) {
      alert("Failed to delete coupon.");
    }
  };

  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponStatus('Creating...');
    try {
      await addCoupon(newCoupon);
      setCouponStatus('Coupon created!');
      setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: 0, is_active: true });
      loadData();
      setTimeout(() => setCouponStatus(''), 3000);
    } catch (err) {
      setCouponStatus(`Error: ${err.message || 'Failed'}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Create Coupon Form */}
      <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm h-fit">
        <h2 className="text-2xl font-bold font-serif text-[#333] mb-6">Create Coupon</h2>
        {couponStatus && <div className="bg-primary/10 text-primary p-3 rounded-lg mb-4 text-sm font-medium border border-primary/20">{couponStatus}</div>}
        
        <form onSubmit={handleCouponSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Promo Code</label>
            <input 
              type="text" 
              placeholder="e.g. SWEET20" 
              value={newCoupon.code} 
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} 
              required 
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm uppercase font-mono font-bold text-[#333]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Discount Type</label>
            <select 
              value={newCoupon.discount_type} 
              onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
              className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm text-[#333] cursor-pointer"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Discount Value</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="e.g. 10 or 150" 
              value={newCoupon.discount_value} 
              onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })} 
              required 
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm font-mono text-[#333]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Minimum Order Value (₹)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="e.g. 500" 
              value={newCoupon.min_order_value} 
              onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: e.target.value })} 
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm font-mono text-[#333]"
            />
          </div>
          
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mt-2 font-semibold">
            <input 
              type="checkbox" 
              checked={newCoupon.is_active} 
              onChange={(e) => setNewCoupon({ ...newCoupon, is_active: e.target.checked })} 
              className="accent-primary w-4 h-4" 
            />
            Make Active Immediately
          </label>
          
          <button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl transition-all mt-2 shadow-[0_4px_12px_rgba(186,36,42,0.15)] active:scale-98 cursor-pointer border-none">
            Create Coupon
          </button>
        </form>
      </div>

      {/* Coupons List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col h-[80vh]">
        <h2 className="text-2xl font-bold font-serif text-[#333] mb-6">Active Coupons</h2>
        <div className="overflow-y-auto pr-2 flex flex-col gap-4 flex-1">
          {coupons.map(coupon => (
            <div 
              key={coupon.code} 
              className={`flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl transition-all gap-4 ${
                coupon.is_active 
                  ? 'bg-[#fafafa] border-primary/30 shadow-sm' 
                  : 'bg-neutral-50/50 border-border/60 opacity-60'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[14px] uppercase font-mono font-black text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 tracking-wider">
                    {coupon.code}
                  </span>
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                    coupon.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black/5 text-muted-foreground'
                  }`}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-foreground font-semibold mt-2">
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% OFF` 
                    : `₹${coupon.discount_value} OFF`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Min Order Value: ₹{coupon.min_order_value || 0}
                </p>
              </div>
              
              <div className="flex items-center gap-4 self-end md:self-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={coupon.is_active} 
                    onChange={() => handleCouponToggle(coupon.code, coupon.is_active)} 
                  />
                  <div className="w-11 h-6 bg-black/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
                
                <button 
                  onClick={() => handleCouponDelete(coupon.code)} 
                  className="p-2 bg-black/5 hover:bg-destructive hover:text-white rounded-lg transition-all text-xs font-bold border-none cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">No coupons created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponManager;
