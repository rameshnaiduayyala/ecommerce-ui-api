import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CurrencyContext = createContext();

// Supported Country / Currency mappings
const COUNTRY_MAP = {
  IN: { name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
  US: { name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  GB: { name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' }
};

// Fallback rates if Exchange Rate API fails
const FALLBACK_RATES = {
  INR: 1.0,
  USD: 0.012, // approx. 1 INR = 0.012 USD
  GBP: 0.0094 // approx. 1 INR = 0.0094 GBP
};

export const CurrencyProvider = ({ children }) => {
  const [countryCode, setCountryCode] = useState(() => localStorage.getItem('wm_user_country') || 'IN');
  const [exchangeRates, setExchangeRates] = useState(FALLBACK_RATES);
  const [loadingGeo, setLoadingGeo] = useState(false);

  const activeCountry = COUNTRY_MAP[countryCode] || COUNTRY_MAP.IN;

  // Real-time exchange rates fetch (base INR)
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/INR')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates({
            INR: 1.0,
            USD: data.rates.USD || FALLBACK_RATES.USD,
            GBP: data.rates.GBP || FALLBACK_RATES.GBP
          });
        }
      })
      .catch(err => {
        console.warn('Failed to fetch real-time exchange rates, using fallback values.', err);
      });
  }, []);

  // Automatic country detection
  useEffect(() => {
    // Skip if user already has a saved country preference
    if (localStorage.getItem('wm_user_country')) return;

    setLoadingGeo(true);
    
    // Quick timezone heuristic fallback first
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    let initialGuess = 'IN';
    if (tz.includes('America') || tz.includes('US')) {
      initialGuess = 'US';
    } else if (tz.includes('Europe/London') || tz.includes('GB') || tz.includes('London')) {
      initialGuess = 'GB';
    }

    // Try a lightweight geolocation detection API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout limit

    fetch('https://ipapi.co/json/', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        const code = data?.country_code;
        if (code && COUNTRY_MAP[code]) {
          setCountryCode(code);
          localStorage.setItem('wm_user_country', code);
        } else {
          setCountryCode(initialGuess);
        }
      })
      .catch(() => {
        // Fallback to timezone guess
        setCountryCode(initialGuess);
      })
      .finally(() => {
        setLoadingGeo(false);
      });
  }, []);

  const changeCountry = useCallback((code) => {
    if (COUNTRY_MAP[code]) {
      setCountryCode(code);
      localStorage.setItem('wm_user_country', code);
      // Dispatch custom event to sync across windows/tabs
      window.dispatchEvent(new Event('wm-currency-changed'));
    }
  }, []);

  // Helper to convert prices
  const convertPrice = useCallback((priceInINR) => {
    const rate = exchangeRates[activeCountry.currency] || FALLBACK_RATES[activeCountry.currency];
    return Number(priceInINR) * rate;
  }, [activeCountry.currency, exchangeRates]);

  // Helper to format values nicely
  const formatPrice = useCallback((priceInINR) => {
    const converted = convertPrice(priceInINR);
    // INR typically shows with 0 decimal places in local style here
    const decimals = activeCountry.currency === 'INR' ? 0 : 2;
    return `${activeCountry.symbol}${converted.toFixed(decimals)}`;
  }, [activeCountry, convertPrice]);

  // Listen to cross-tab/window updates
  useEffect(() => {
    const handleStorageSync = () => {
      const code = localStorage.getItem('wm_user_country');
      if (code && COUNTRY_MAP[code]) {
        setCountryCode(code);
      }
    };
    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('wm-currency-changed', handleStorageSync);
    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('wm-currency-changed', handleStorageSync);
    };
  }, []);

  const value = {
    countryCode,
    countryName: activeCountry.name,
    currency: activeCountry.currency,
    symbol: activeCountry.symbol,
    flag: activeCountry.flag,
    changeCountry,
    convertPrice,
    formatPrice,
    loadingGeo,
    rates: exchangeRates
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
