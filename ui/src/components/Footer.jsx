import logoImg from '../assets/logo.png';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getStoreSettings } from '../api/admin';

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
      </svg>
    ),
  },
];

const Footer = () => {
  const [settings, setSettings] = useState({
    store_name: 'Aha Konaseema',
    origin_address: 'Ravulapalem, East Godavari District, Andhra Pradesh - 533238',
    support_phone: '+91 9988776655',
    support_email: 'support@ahakonaseema.com',
  });

  // Helper: is phone a usable value?
  const phoneValid = settings.support_phone && settings.support_phone !== 'undefined';

  useEffect(() => {
    let active = true;
    getStoreSettings()
      .then(data => { if (data && active) setSettings(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return (
    <footer className="mt-16 w-full">

      {/* ── TOP DARK BRAND PANEL ── */}
      <div className="bg-gradient-to-br from-[#090e1a] via-[#101c36] to-[#020617] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_50%,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="container mx-auto px-4 md:px-8 py-16 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12">

            {/* Brand column */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shrink-0">
                  <img src={logoImg} alt="Aha Konaseema" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-[8px] font-bold tracking-[0.3em] uppercase text-white/50">Since 1948</p>
                  <p className="text-sm font-serif font-black text-white leading-tight">Aha Konaseema</p>
                  <p className="text-[8px] tracking-[0.2em] uppercase text-amber-400/80 font-medium">Pure Ghee Sweets</p>
                </div>
              </div>

              <p className="text-xs text-white/55 leading-relaxed font-medium max-w-xs">
                Rooted in the rich heritage of Godavari, Aha Konaseema has been crafting authentic sweets with pure milk ghee since 1948. Every bite carries generations of tradition.
              </p>

              {/* Contact */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={phoneValid ? `tel:${settings.support_phone}` : undefined}
                  className="flex items-center gap-2.5 text-xs text-white/60 hover:text-amber-400 transition-colors font-medium group"
                >
                  <span className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-amber-400/15 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                  </span>
                  {settings.support_phone}
                </a>
                <a href={`mailto:${settings.support_email}`} className="flex items-center gap-2.5 text-xs text-white/60 hover:text-amber-400 transition-colors font-medium group">
                  <span className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-amber-400/15 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                  </span>
                  <span className="truncate">{settings.support_email}</span>
                </a>
                <div className="flex items-start gap-2.5 text-xs text-white/60 font-medium">
                  <span className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  </span>
                  <span className="leading-relaxed">{settings.origin_address}</span>
                </div>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-2 pt-1">
                {SOCIAL_LINKS.map(s => (
                  <a key={s.label} href={s.href} aria-label={s.label} className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#0071CE] hover:border-[#0071CE] transition-all duration-200">
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Products */}
            <div>
              <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40 mb-5">Products</h4>
              <ul className="flex flex-col gap-3">
                {['All Sweets', 'Ghee Sweets', 'Jaggery Sweets', 'Khara & Snacks', 'Gift Boxes', 'Festive Combos'].map(l => (
                  <li key={l}>
                    <Link to="/products" className="text-xs font-medium text-white/60 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-amber-400 transition-colors shrink-0"></span>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Navigate */}
            <div>
              <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40 mb-5">Navigate</h4>
              <ul className="flex flex-col gap-3">
                {[
                  { label: 'Home', to: '/' },
                  { label: 'Categories', to: '/categories' },
                  { label: 'Search', to: '/search' },
                  { label: 'Wishlist', to: '/wishlist' },
                  { label: 'My Orders', to: '/orders' },
                  { label: 'My Profile', to: '/profile' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-xs font-medium text-white/60 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-amber-400 transition-colors shrink-0"></span>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-[9px] font-black tracking-[0.3em] uppercase text-white/40 mb-5">Policies</h4>
              <ul className="flex flex-col gap-3">
                {['Privacy Policy', 'Terms & Conditions', 'Shipping Policy', 'Return & Refund', 'Payment Policy'].map(l => (
                  <li key={l}>
                    <Link to="/" className="text-xs font-medium text-white/60 hover:text-amber-400 transition-colors flex items-center gap-2 group">
                      <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-amber-400 transition-colors shrink-0"></span>
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Quality badges */}
              <div className="mt-8 flex flex-col gap-2">
                {['🐄 100% Pure Ghee', '🔒 Vacuum Sealed', '🚚 Pan India Delivery'].map(b => (
                  <span key={b} className="text-[9px] font-bold text-amber-400/70 tracking-wider">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/8">
          <div className="container mx-auto px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
            <p className="text-[10px] text-white/35 font-medium">
              © {new Date().getFullYear()} {settings.store_name}. All Rights Reserved.
            </p>
            <p className="text-[10px] text-white/35 font-medium flex items-center gap-1">
              Designed &amp; Developed with
              <span className="text-red-500 animate-pulse mx-0.5">❤️</span>
              by{' '}
              <a
                href="https://rameshayyala.online"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400/70 hover:text-amber-400 transition-colors font-bold ml-1"
              >
                Ramesh Naidu
              </a>
            </p>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
