import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 404 Number */}
      <div className="relative mb-6">
        <span className="text-[120px] md:text-[180px] font-serif font-black leading-none bg-clip-text text-transparent bg-gradient-to-br from-primary via-[#c84248] to-amber-400 select-none">
          404
        </span>
        <div className="absolute inset-0 blur-[60px] opacity-10 bg-primary rounded-full pointer-events-none"></div>
      </div>

      {/* Message */}
      <div className="max-w-md mb-10 relative z-10">
        <h1 className="text-2xl md:text-3xl font-serif font-black text-[#222] mb-3 tracking-tight">Page Not Found</h1>
        <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed">
          The page you're looking for has been moved or doesn't exist. Let's get you back to our collection of premium Konaseema sweets.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center relative z-10">
        <Link to="/" className="bg-primary hover:bg-black text-white font-bold py-3 px-8 rounded-full transition-all duration-300 uppercase tracking-wider text-xs shadow-md hover:-translate-y-0.5">
          Back to Home
        </Link>
        <Link to="/products" className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold py-3 px-8 rounded-full transition-all duration-300 uppercase tracking-wider text-xs hover:-translate-y-0.5">
          Browse Sweets
        </Link>
      </div>

      {/* Subtle brand tagline */}
      <p className="mt-16 text-[10px] tracking-[0.3em] uppercase font-bold text-muted-foreground/50 relative z-10">
        Aha Konaseema — Pure Cattle Ghee Sweets Since 1948
      </p>
    </div>
  );
};

export default NotFoundPage;
