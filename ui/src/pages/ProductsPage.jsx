import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../api/catalog';

const SORT_OPTIONS = [
  { label: 'Newest First',    value: 'createdAt_desc' },
  { label: 'Price: Low → High', value: 'basePrice_asc' },
  { label: 'Price: High → Low', value: 'basePrice_desc' },
  { label: 'Name A-Z',        value: 'name_asc' },
];

const PAGE_SIZE = 16;

const ProductsPage = () => {
  const [products, setProducts]         = useState([]);
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedCat, setSelectedCat]   = useState('');
  const [sort, setSort]                 = useState('createdAt_desc');
  const [minPrice, setMinPrice]         = useState('');
  const [maxPrice, setMaxPrice]         = useState('');
  const [page, setPage]                 = useState(0);
  const [hasMore, setHasMore]           = useState(true);
  const [total, setTotal]               = useState(0);

  // Fetch categories once
  useEffect(() => {
    getCategories().then(cats => setCategories(cats || [])).catch(console.error);
  }, []);

  const buildFilters = useCallback((pageIndex = 0) => {
    const [sortBy, sortOrder] = sort.split('_');
    const filters = {
      take: PAGE_SIZE,
      skip: pageIndex * PAGE_SIZE,
      sortBy,
      sortOrder,
      status: 'PUBLISHED',
    };
    if (selectedCat)  filters.categoryId = selectedCat;
    if (searchQuery)  filters.search     = searchQuery;
    if (minPrice)     filters.minPrice   = minPrice;
    if (maxPrice)     filters.maxPrice   = maxPrice;
    return filters;
  }, [sort, selectedCat, searchQuery, minPrice, maxPrice]);

  // Initial / filter-change fetch
  useEffect(() => {
    setLoading(true);
    setPage(0);
    getProducts(buildFilters(0))
      .then(data => {
        setProducts(data || []);
        setHasMore((data || []).length === PAGE_SIZE);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sort, selectedCat, minPrice, maxPrice]);  // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setPage(0);
      getProducts(buildFilters(0))
        .then(data => {
          setProducts(data || []);
          setHasMore((data || []).length === PAGE_SIZE);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const more = await getProducts(buildFilters(nextPage));
      setProducts(prev => [...prev, ...(more || [])]);
      setPage(nextPage);
      setHasMore((more || []).length === PAGE_SIZE);
    } finally {
      setLoadingMore(false);
    }
  };

  const clearFilters = () => {
    setSelectedCat('');
    setSearchQuery('');
    setMinPrice('');
    setMaxPrice('');
    setSort('createdAt_desc');
  };

  const hasActiveFilters = selectedCat || searchQuery || minPrice || maxPrice || sort !== 'createdAt_desc';

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">

      {/* ── PAGE BANNER ── */}
      <div className="bg-gradient-to-br from-primary via-[#85161b] to-black text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_50%,_white_1px,_transparent_1px)] bg-[length:30px_30px]" />
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-amber-400 mb-2 block">Browse Catalog</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight">All Products</h1>
            <p className="text-white/65 text-sm max-w-md">
              Handcrafted sweets, authentic delicacies, and festive gifts — shipped fresh to your door.
            </p>
          </div>

          {/* Sort + Search (top bar on mobile) */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-56 pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-amber-400/60 transition-all"
              />
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm rounded-full px-4 py-2.5 focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-black">{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── FILTER SIDEBAR ── */}
          <aside className="lg:w-64 shrink-0">
            <div className="filter-sidebar">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-sm text-[#1a1a1a]">Filters</h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[10px] text-primary font-bold hover:underline">
                    Clear All
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Category</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => setSelectedCat('')}
                    className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      !selectedCat ? 'bg-primary text-white' : 'text-[#333] hover:bg-black/4 hover:text-primary'
                    }`}
                  >
                    All Products
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCat(cat.id)}
                      className={`text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between ${
                        selectedCat === cat.id ? 'bg-primary text-white' : 'text-[#333] hover:bg-black/4 hover:text-primary'
                      }`}
                    >
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Price Range (₹)</p>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-[#333]"
                  />
                  <span className="text-muted-foreground text-xs shrink-0">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-[#333]"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── PRODUCT GRID ── */}
          <main className="flex-1">
            {/* Results count */}
            {!loading && (
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-muted-foreground font-medium">
                  Showing <span className="text-[#1a1a1a] font-bold">{products.length}</span> products
                  {selectedCat && categories.find(c => c.id === selectedCat) && (
                    <> in <span className="text-primary font-bold">{categories.find(c => c.id === selectedCat)?.name}</span></>
                  )}
                </p>
                {hasActiveFilters && (
                  <div className="flex gap-2 flex-wrap">
                    {selectedCat && (
                      <span className="badge badge-primary gap-1.5">
                        {categories.find(c => c.id === selectedCat)?.name}
                        <button onClick={() => setSelectedCat('')} className="ml-1 opacity-60 hover:opacity-100">×</button>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="badge badge-primary gap-1.5">
                        "{searchQuery}"
                        <button onClick={() => setSearchQuery('')} className="ml-1 opacity-60 hover:opacity-100">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border/40">
                    <div className="skeleton aspect-square" />
                    <div className="p-3.5 space-y-2">
                      <div className="skeleton h-3 w-1/2 rounded" />
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-4 w-3/4 rounded" />
                      <div className="skeleton h-8 w-full rounded-lg mt-2" />
                    </div>
                  </div>
                ))
              ) : products.length > 0 ? (
                products.map(p => <ProductCard key={p.id} product={p} />)
              ) : (
                <div className="col-span-full text-center py-24 bg-white rounded-3xl border border-border/40">
                  <span className="text-5xl mb-4 block">🔍</span>
                  <p className="text-muted-foreground font-semibold text-sm">No products found</p>
                  <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="mt-4 btn-primary text-xs py-2 px-5">
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Load more */}
            {!loading && hasMore && products.length > 0 && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-ghost px-10 py-3 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : 'Load More Products'}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
