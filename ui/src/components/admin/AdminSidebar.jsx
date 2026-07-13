import React from 'react';

const AdminSidebar = ({ activeTab, setActiveTab, userEmail, onSignOut }) => {
  const tabs = [
    { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
    { id: 'products', label: 'Inventory Catalog', icon: '📦' },
    { id: 'categories', label: 'Categories Manager', icon: '📂' },
    { id: 'orders', label: 'Fulfillment Control', icon: '🛵' },
    { id: 'announcements', label: 'Flash Announcements', icon: '⚡' },
    { id: 'coupons', label: 'Campaign Coupons', icon: '🎟️' },
    { id: 'settings', label: 'Store Settings', icon: '⚙️' },
  ];

  return (
    <aside className="no-print w-64 bg-[#0d1627] text-slate-300 border-r border-slate-800 flex flex-col shrink-0 sticky top-0 h-screen select-none z-30">
      {/* Brand header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <span className="text-2xl">🍯</span>
        <div>
          <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">Aha Konaseema</h1>
          <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mt-1 block">Enterprise Admin</span>
        </div>
      </div>
      
      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto scrollbar-none">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border-none outline-none ${
                active 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400 bg-transparent'
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Admin Profile Details */}
      <div className="p-4 border-t border-slate-800 bg-[#070d18] flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-white truncate">Administrator</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail || 'admin@ahakonaseema.com'}</p>
          </div>
        </div>
        {onSignOut && (
          <button 
            onClick={onSignOut}
            className="text-slate-500 hover:text-red-400 p-2 rounded-lg cursor-pointer bg-transparent border-none outline-none"
            title="Sign Out"
          >
            🚪
          </button>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
