import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

// Custom Tooltip component for sleek look
const CustomTooltip = ({ active, payload, label, prefix = '₹' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 border border-border shadow-lg rounded-2xl text-xs font-semibold text-[#333]">
        {label && <p className="text-muted-foreground font-medium mb-1 font-mono">{label}</p>}
        {payload.map((item, index) => (
          <p key={index} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }}></span>
            <span>{item.name}:</span>
            <span className="font-bold font-mono text-primary">
              {prefix}{item.value.toLocaleString('en-IN')}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Sales Trend Area Chart
export const SalesTrendChart = ({ data = [] }) => {
  return (
    <div className="w-full h-[320px] magic-glow-card glow-hover rounded-3xl border border-border/50 p-5 shadow-sm transition-all flex flex-col gap-4">
      <div>
        <h3 className="text-md font-bold text-[#333] font-serif">Revenue Performance</h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Daily order sales & revenue trend</p>
      </div>
      <div className="flex-1 w-full h-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#BA242A" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#BA242A" stopOpacity={0.005}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 10, fontWeight: 500 }} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#888', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(v) => `₹${v}`} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="Sales" 
              name="Gross Revenue"
              stroke="#BA242A" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#salesGradient)" 
              activeDot={{ r: 6, fill: '#BA242A', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 2. Order Status Donut Chart
export const OrderStatusChart = ({ data = [] }) => {
  const COLORS = {
    pending: '#F59E0B',
    preparing: '#3B82F6',
    shipped: '#0EA5E9',
    delivered: '#10B981',
    cancelled: '#EF4444'
  };

  const hasData = data && data.length > 0;

  return (
    <div className="w-full h-[320px] magic-glow-card glow-hover rounded-3xl border border-border/50 p-5 shadow-sm transition-all flex flex-col gap-2">
      <div>
        <h3 className="text-md font-bold text-[#333] font-serif">Fulfillment Distribution</h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Order status breakout metrics</p>
      </div>
      
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-border flex items-center justify-center mb-3">
            <span className="text-xl">📊</span>
          </div>
          <h4 className="text-xs font-bold text-[#333]">No orders recorded</h4>
          <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1">Fulfillment ratios will display here once customers make purchases.</p>
        </div>
      ) : (
        <div className="flex-1 w-full h-full min-h-0 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.statusKey] || '#888'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip prefix="" />} />
              <Legend 
                verticalAlign="bottom" 
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#444' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total Badge inside donut */}
          <div className="absolute flex flex-col items-center justify-center pb-6">
            <span className="text-[10px] uppercase tracking-wider font-mono font-bold text-muted-foreground">Total</span>
            <span className="text-2xl font-black font-serif text-[#333]">
              {data.reduce((acc, curr) => acc + curr.value, 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Product Distribution Bar Chart
export const ProductDistributionChart = ({ data = [] }) => {
  const hasData = data && data.length > 0;
  const sortedData = hasData ? [...data].sort((a, b) => b.Sales - a.Sales).slice(0, 5) : [];

  return (
    <div className="w-full h-[320px] magic-glow-card glow-hover rounded-3xl border border-border/50 p-5 shadow-sm transition-all flex flex-col gap-4">
      <div>
        <h3 className="text-md font-bold text-[#333] font-serif">Popular Confections</h3>
        <p className="text-xs text-muted-foreground mt-0.5 font-medium">Top selling items by quantity ordered</p>
      </div>
      
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-16 h-16 rounded-full bg-[#fafafa] border border-border flex items-center justify-center mb-3">
            <span className="text-xl">🍬</span>
          </div>
          <h4 className="text-xs font-bold text-[#333]">No sweet sales yet</h4>
          <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1">Confection rankings will automatically update here as orders come in.</p>
        </div>
      ) : (
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f5f5f5" />
              <XAxis 
                type="number" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 9, fontWeight: 500 }} 
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                width={90}
                tick={{ fill: '#444', fontSize: 9, fontWeight: 600 }} 
              />
              <Tooltip content={<CustomTooltip prefix="" />} />
              <Bar 
                dataKey="Sales" 
                name="Units Sold" 
                radius={[0, 8, 8, 0]}
                maxBarSize={16}
              >
                {sortedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={index === 0 ? '#BA242A' : index === 1 ? '#DE3B40' : '#E5E7EB'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
