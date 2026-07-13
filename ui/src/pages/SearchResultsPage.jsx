import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getProducts } from '../api/catalog';
import ProductCard from '../components/ProductCard';

const SearchResultsPage = () => {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const search = async () => {
      setLoading(true);
      try {
        const data = await getProducts({ search: query, take: 50, status: 'PUBLISHED' });
        const mapped = (data || []).map(p => ({
          ...p,
          price: Number(p.basePrice),
          image_url: p.images?.[0]?.url || null,
          category: p.categories?.[0]?.category?.name || ''
        }));
        setResults(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (query) search();
    else setLoading(false);
  }, [query]);

  return (
    <div className="min-h-screen pb-20">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#f9f5f0] to-[#fdf8f3] border-b border-border/40 py-10 px-4">
        <div className="container mx-auto">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-2 block">Search</span>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-[#222] mb-1">
            {query ? `Results for "${query}"` : 'Search Products'}
          </h1>
          {!loading && query && (
            <p className="text-muted-foreground text-sm font-medium">
              {results.length} product{results.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 mt-10">
        {!query ? (
          <div className="text-center py-24">
            <span className="text-5xl mb-4 block">🔍</span>
            <p className="text-muted-foreground font-semibold text-lg">Enter a search term in the navigation bar to find products.</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[380px] bg-black/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-black/3 rounded-3xl border border-border/30">
            <span className="text-5xl mb-4 block">😔</span>
            <h2 className="text-xl font-serif font-black text-[#222] mb-2">No results found</h2>
            <p className="text-muted-foreground font-medium text-sm">
              We couldn't find any products matching <span className="font-bold text-primary">"{query}"</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
