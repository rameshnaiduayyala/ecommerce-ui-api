import React from 'react';
import { SalesTrendChart, OrderStatusChart, ProductDistributionChart } from '../AdminCharts';

const DashboardOverview = ({ 
  products = [], 
  orders = [], 
  announcements = [], 
  coupons = [],
  salesTrendData = [],
  orderStatusData = [],
  productSalesData = []
}) => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in mb-12">
      {/* Executive Quick Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            📦
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Total Catalog</span>
          <span className="text-xl font-black text-[#333]">{products.length} Products</span>
        </div>
        
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            📊
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Store Orders</span>
          <span className="text-xl font-black text-[#333]">{orders.length} Placed</span>
        </div>
 
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            ⚡
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Flash Alerts</span>
          <span className="text-xl font-black text-[#333]">
            {announcements.filter(a => a.is_active).length} Active
          </span>
        </div>
 
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            🎟️
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Coupon Campaign</span>
          <span className="text-xl font-black text-[#333]">
            {coupons.filter(c => c.is_active).length} Active
          </span>
        </div>
      </div>

      {/* Top Main Sales Trend Area Chart */}
      <div className="w-full">
        <SalesTrendChart data={salesTrendData} />
      </div>
      
      {/* Side-by-side breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusChart data={orderStatusData} />
        <ProductDistributionChart data={productSalesData} />
      </div>
    </div>
  );
};

export default DashboardOverview;
