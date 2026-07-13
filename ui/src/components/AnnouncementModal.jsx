import React, { useEffect, useState } from 'react';
import { getAnnouncements, getStoreSettings } from '../api/admin';
import logoImg from '../assets/logo.png';


const AnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    // Check if shown today
    const lastShown = localStorage.getItem('aha_announcement_last_shown');
    const todayStr = new Date().toISOString().split('T')[0];

    if (lastShown === todayStr) {
      return; // Already shown today
    }

    const loadData = async () => {
      try {
        // 1. Fetch store settings
        const settingsData = await getStoreSettings();
        setStoreSettings(settingsData);

        // 2. Fetch all active announcements
        const annData = await getAnnouncements();
        const activeAnn = annData?.filter(a => a.is_active) || [];

        if (activeAnn.length > 0) {
          setAnnouncements(activeAnn);
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch (err) {
        console.warn('Failed to load announcements in modal:', err);
      }
    };

    loadData();
  }, []);

  const handleClose = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem('aha_announcement_last_shown', todayStr);
    setIsOpen(false);
  };

  if (!isOpen || announcements.length === 0) return null;

  // Modern badges depending on announcement type
  const typeStyles = {
    critical: {
      bg: 'from-red-500/5 to-rose-600/5 border-red-500/20',
      badge: 'bg-red-500 text-white',
      accentColor: 'bg-red-500',
      iconEmoji: '🚨',
      glow: 'shadow-[0_4px_16px_rgba(239,68,68,0.06)]'
    },
    warning: {
      bg: 'from-amber-500/5 to-orange-600/5 border-amber-500/20',
      badge: 'bg-amber-500 text-white',
      accentColor: 'bg-amber-500',
      iconEmoji: '⚠️',
      glow: 'shadow-[0_4px_16px_rgba(245,158,11,0.06)]'
    },
    success: {
      bg: 'from-emerald-500/5 to-teal-600/5 border-emerald-500/20',
      badge: 'bg-emerald-500 text-white',
      accentColor: 'bg-emerald-500',
      iconEmoji: '✅',
      glow: 'shadow-[0_4px_16px_rgba(16,185,129,0.06)]'
    },
    info: {
      bg: 'from-primary/5 to-[#85161b]/5 border-primary/20',
      badge: 'bg-primary text-white',
      accentColor: 'bg-primary',
      iconEmoji: '📢',
      glow: 'shadow-[0_4px_16px_rgba(186,36,42,0.06)]'
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-[32px] overflow-hidden border border-border/50 shadow-2xl p-5 sm:p-8 flex flex-col items-center gap-4 sm:gap-6 transition-all duration-300 transform scale-100 shadow-[0_0_50px_rgba(0,0,0,0.15)]">

        {/* Floating Abstract Glow Spot */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-20 bg-primary"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 bg-amber-400"></div>

        {/* Modal Header Brand Logo / Icon */}
        <div className="relative flex items-center justify-center bg-white rounded-full w-20 h-20 shadow-lg border border-border/60 p-2 shrink-0 select-none">
          <img src={logoImg} alt="Aha Konaseema Logo" className="w-full h-full object-contain rounded-full" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[8px] font-bold text-white items-center justify-center font-sans">!</span>
          </span>
        </div>

        {/* Content Header */}
        <div className="text-center relative z-10">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-1 uppercase tracking-wider">
            Important updates from Aha Konaseema
          </p>
        </div>

        {/* Scrollable Active Announcements Container */}
        <div className="w-full flex flex-col gap-3 sm:gap-4 max-h-[200px] sm:max-h-[280px] overflow-y-auto pr-1 select-none relative z-10 custom-scrollbar">
          {announcements.map((ann) => {
            const style = typeStyles[ann.type] || typeStyles.info;
            return (
              <div
                key={ann.id}
                className={`flex gap-2.5 sm:gap-3 text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border bg-gradient-to-br ${style.bg} ${style.glow} transition-all duration-300 relative overflow-hidden`}
              >
                {/* Left vertical Accent Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accentColor}`}></div>

                <span className="text-lg sm:text-xl shrink-0 mt-0.5">{style.iconEmoji}</span>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[7px] sm:text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
                      {ann.type === 'critical' ? 'Urgent Alert' : ann.type === 'warning' ? 'Attention' : 'Store Update'}
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-muted-foreground font-bold">
                      {new Date(ann.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-[#333] leading-relaxed">
                    {ann.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>


        {/* Action Button & Close */}
        <div className="flex flex-col w-full gap-2 sm:gap-3 mt-1 shrink-0">
          <button
            onClick={handleClose}
            className="w-full bg-primary hover:bg-black text-white font-bold py-3 sm:py-3.5 px-6 rounded-full transition-all duration-300 active:scale-98 shadow-md uppercase tracking-wider text-[10px] sm:text-xs"
          >
            Acknowledge & Close
          </button>

          <button
            onClick={handleClose}
            className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/80 hover:text-black transition-colors py-0.5"
          >
            Dismiss for today
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
