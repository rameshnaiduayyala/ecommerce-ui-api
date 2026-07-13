import React, { useState } from 'react';

const AdminHeader = ({ activeTab, userEmail, onSearchChange, onSearchSubmit, searchValue, onQuickAction, onSignOut }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifications = [
    { id: 1, text: '🚨 New order #ORD-8271 placed via USA (USD)', time: '5m ago', type: 'order' },
    { id: 2, text: '📦 Variant stock threshold alert: Ghee Laddu (500g)', time: '20m ago', type: 'inventory' },
    { id: 3, text: '⚡ System announcement published successfully', time: '1h ago', type: 'system' }
  ];

  return (
    <header className="no-print bg-white border-b border-border/80 px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Global ERP System Search */}
      <div className="flex-1 max-w-md">
        <form onSubmit={onSearchSubmit} className="relative">
          <input 
            type="text" 
            placeholder="🔍 Scan global ERP database (SKU, orders, clients)..." 
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-[#fafafa] border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#333] placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white transition-all font-medium"
          />
        </form>
      </div>

      {/* Right control utilities */}
      <div className="flex items-center gap-6">
        {/* Status badges */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] font-black uppercase tracking-wider">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Database: Connected
          </div>
          <div className="flex items-center gap-1.5 bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1 rounded-full">
            Role: Super Admin
          </div>
        </div>

        {/* Quick Shortcut Utilities */}
        {onQuickAction && (
          <button 
            onClick={() => onQuickAction('add-product')}
            className="hidden sm:flex items-center gap-1 bg-slate-900 hover:bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all active:scale-98 border-none cursor-pointer"
          >
            + Quick SKU
          </button>
        )}

        {/* Notification Bell Badge */}
        <div className="relative">
          <button 
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="relative p-2 hover:bg-neutral-50 rounded-xl transition-all cursor-pointer border-none bg-transparent"
            aria-label="View notifications"
          >
            <span className="text-lg">🔔</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
          </button>
          
          {notificationOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-border rounded-2xl shadow-xl py-3 z-50 animate-scale-up">
              <div className="px-4 pb-2 border-b border-border flex justify-between items-center">
                <span className="text-xs font-bold text-[#333]">System Logs</span>
                <span className="text-[9px] text-primary font-bold hover:underline cursor-pointer">Clear logs</span>
              </div>
              <div className="flex flex-col max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="px-4 py-3 hover:bg-neutral-50 border-b border-border/40 last:border-none flex flex-col gap-1 cursor-pointer">
                    <p className="text-[11px] font-medium text-slate-700">{n.text}</p>
                    <span className="text-[9px] text-slate-400 font-mono">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Server Clock Widget */}
        <div className="hidden md:flex flex-col text-right">
          <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-none">System Clock</span>
          <span className="text-xs font-bold text-slate-800 mt-1 font-mono">{new Date().toLocaleTimeString()}</span>
        </div>

        {/* Interactive User profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-9 h-9 rounded-full bg-primary text-white font-black text-xs flex items-center justify-center cursor-pointer border-2 border-slate-200 hover:border-primary transition-all overflow-hidden shrink-0 outline-none"
          >
            {userEmail ? userEmail.substring(0, 2).toUpperCase() : 'AD'}
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white border border-border rounded-2xl shadow-xl py-2.5 z-50 animate-scale-up">
              <div className="px-4 py-2 border-b border-border/60">
                <p className="text-xs font-black text-slate-800">Administrator</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{userEmail || 'admin@ahakonaseema.com'}</p>
              </div>
              <div className="flex flex-col pt-1">
                <a href="/" className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-neutral-50 hover:text-slate-800 transition-colors">
                  🌐 Visit Front Store
                </a>
                <button 
                  onClick={onSignOut}
                  className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
                >
                  🚪 Logout Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
