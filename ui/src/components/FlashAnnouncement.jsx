import { useState, useEffect, useRef } from 'react';
import { getAnnouncements } from '../api/admin';

const TYPE_ICON = { critical: '🚨', warning: '⚠️', success: '🎉', info: '📢' };
const TYPE_COLOR = {
  critical: 'bg-red-600',
  warning:  'bg-amber-500',
  success:  'bg-emerald-600',
  info:     'bg-gradient-to-r from-primary to-[#85161b]',
};

const FlashAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAnnouncements();
        setAnnouncements(data?.filter(a => a.is_active) || []);
      } catch (err) {
        console.error('FlashAnnouncement:', err);
      }
    };
    fetch();
  }, []);

  const active = announcements.filter(a => !dismissedIds.includes(a.id));

  // Auto-rotate every 5s with fade transition
  useEffect(() => {
    if (active.length <= 1) return;
    timerRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % active.length);
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [active.length]);

  if (!isVisible || active.length === 0) return null;

  const safeIdx = currentIndex >= active.length ? 0 : currentIndex;
  const current = active[safeIdx];
  const icon = TYPE_ICON[current.type] || TYPE_ICON.info;
  const bgClass = TYPE_COLOR[current.type] || TYPE_COLOR.info;

  const dismissCurrent = () => {
    setDismissedIds(prev => [...prev, current.id]);
    setCurrentIndex(0);
  };

  const dismissAll = () => setIsVisible(false);

  const goPrev = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + active.length) % active.length);
      setAnimating(false);
    }, 200);
  };

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % active.length);
      setAnimating(false);
    }, 200);
  };

  return (
    <div className={`${bgClass} text-white relative overflow-hidden`}>
      {/* Subtle shimmer line */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.06)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />

      <div className="relative z-10 flex items-center min-h-[36px] px-4">

        {/* Left — nav arrows (multi-announcement only) */}
        {active.length > 1 && (
          <div className="flex items-center gap-1 shrink-0 mr-3">
            <button
              onClick={goPrev}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition-all"
              aria-label="Previous announcement"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-[8px] font-black text-white/70 tabular-nums min-w-[24px] text-center">
              {safeIdx + 1}/{active.length}
            </span>
            <button
              onClick={goNext}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition-all"
              aria-label="Next announcement"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}

        {/* Center — announcement text */}
        <div className="flex-1 flex items-center justify-center gap-2 py-2">
          <span
            className={`transition-all duration-300 flex items-center gap-2 text-center ${animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
          >
            <span className="text-sm leading-none">{icon}</span>
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-white leading-tight">
              {current.text}
            </span>
          </span>
        </div>

        {/* Right — dismiss controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-3">
          {/* Dot indicators */}
          {active.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 mr-1">
              {active.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); }}
                  className={`rounded-full transition-all duration-300 ${i === safeIdx ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/35 hover:bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {/* Dismiss current */}
          <button
            onClick={dismissCurrent}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition-all"
            aria-label="Dismiss this announcement"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-2.5 h-2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashAnnouncement;
