import { useState, useEffect } from 'react';
import { getCategories, getProducts, getProductsByCategory } from '../api/catalog';
import ProductCard from '../components/ProductCard';

const CATEGORY_EMOJIS = ['🍬', '🍮', '🧆', '🍯', '🌶️', '🎁', '🌾', '🍟', '🍡', '🥮', '🫙', '🍛'];
const CATEGORY_COLORS = [
  'from-orange-500/8 to-amber-500/8 border-orange-200',
  'from-rose-500/8 to-pink-500/8 border-rose-200',
  'from-yellow-500/8 to-orange-400/8 border-yellow-200',
  'from-emerald-500/8 to-teal-500/8 border-emerald-200',
  'from-violet-500/8 to-purple-500/8 border-violet-200',
  'from-blue-500/8 to-cyan-500/8 border-blue-200',
];

const CategoriesPage = () => {
  const [categories, setCategories]           = useState([]);
  const [products, setProducts]               = useState([]);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = All
  const [productCounts, setProductCounts]     = useState({});

  // Fetch categories and all products once
  useEffect(() => {
    const init = async () => {
      try {
        const [cats, allProds] = await Promise.all([
          getCategories(),
          getProducts({ take: 200, status: 'PUBLISHED' }),
        ]);
        setCategories(cats || []);
        setProducts(allProds || []);

        // Build product counts per category
        const counts = {};
        (allProds || []).forEach(p => {
          const catId = p.categoryId || p.categories?.[0]?.categoryId || p.categories?.[0]?.category?.id;
          if (catId) counts[catId] = (counts[catId] || 0) + 1;
        });
        setProductCounts(counts);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch filtered products when category is selected
  const handleSelectCategory = async (cat) => {
    setSelectedCategory(cat);
    if (!cat) {
      setCategoryProducts([]); // reset; "All" uses the main products state
      return;
    }

    setProductsLoading(true);
    try {
      const filtered = await getProductsByCategory(cat.id, { take: 100, status: 'PUBLISHED' });
      setCategoryProducts(filtered || []);
    } catch (err) {
      console.error(err);
      setCategoryProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Use category-specific products when a category is selected,
  // otherwise fall back to the initial full product list.
  const displayedProducts = selectedCategory ? categoryProducts : products;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">

      {/* ── TOP BAR ── */}
      <div className="bg-white border-b border-border/40 py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="container mx-auto relative z-10">
          <span className="text-[10px] font-black tracking-[0.3em] uppercase text-primary mb-2 block">
            Shop by Category
          </span>
          <h1 className="text-3xl font-bold text-[#1a1a1a] tracking-tight">
            All Categories
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md font-medium">
            Authentic sweets, pickles, and traditional delicacies prepared fresh daily in Konaseema.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── SIDEBAR ── */}
          <aside className="lg:w-72 shrink-0">
            <div className="lg:sticky lg:top-24 bg-white border border-border/50 rounded-2xl p-4 shadow-sm">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 hidden lg:block">
                Categories
              </h2>

              {/* Scrollable category list */}
              <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">

                {/* All tab */}
                <button
                  onClick={() => handleSelectCategory(null)}
                  className={`flex items-center gap-3 shrink-0 lg:w-full px-4 py-3 rounded-xl font-semibold text-xs border transition-all duration-200 cursor-pointer ${
                    !selectedCategory
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white border-border/50 text-[#333] hover:border-primary/30 hover:text-primary hover:bg-primary/4'
                  }`}
                >
                  <span className="text-lg">🏪</span>
                  <div className="text-left">
                    <p className="font-bold text-xs">All Products</p>
                    <p className={`text-[9px] font-medium ${!selectedCategory ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {products.length} items
                    </p>
                  </div>
                </button>

                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-14 lg:w-full w-32 rounded-xl shrink-0" />
                  ))
                  : categories.map((cat, idx) => {
                    const emoji = CATEGORY_EMOJIS[idx % CATEGORY_EMOJIS.length];
                    const count = productCounts[cat.id] || 0;
                    const isSelected = selectedCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat)}
                        className={`flex items-center gap-3 shrink-0 lg:w-full px-4 py-3 rounded-xl font-semibold text-xs border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white border-border/50 text-[#333] hover:border-primary/30 hover:text-primary hover:bg-primary/4'
                        }`}
                      >
                        <span className="text-lg shrink-0">{emoji}</span>
                        <div className="text-left min-w-0">
                          <p className="font-bold text-xs truncate">{cat.name}</p>
                          <p className={`text-[9px] font-medium ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {count} items
                          </p>
                        </div>
                        {count > 0 && (
                          <span className={`ml-auto shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })
                }
              </div>
            </div>
          </aside>

          {/* ── PRODUCT AREA ── */}
          <main className="flex-1">

            {/* Category header */}
            <div className="bg-white border border-border/40 rounded-2xl p-5 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedCategory ? (
                  <>
                    <span className="text-2xl">
                      {CATEGORY_EMOJIS[categories.findIndex(c => c.id === selectedCategory.id) % CATEGORY_EMOJIS.length]}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1a1a]">{selectedCategory.name}</h2>
                      {selectedCategory.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedCategory.description}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🏪</span>
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1a1a]">All Products</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Browse our complete collection</p>
                    </div>
                  </>
                )}
              </div>
              <span className="badge badge-primary">
                {displayedProducts.length} Products
              </span>
            </div>

            {/* Product grid */}
            {loading || productsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border/40">
                    <div className="skeleton aspect-square" />
                    <div className="p-3.5 space-y-2">
                      <div className="skeleton h-3 w-1/2 rounded" />
                      <div className="skeleton h-4 w-full rounded" />
                      <div className="skeleton h-8 w-full rounded-lg mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-fade-in">
                {displayedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border border-border/40">
                <span className="text-5xl mb-4 block">🍯</span>
                <h3 className="font-bold text-sm text-[#1a1a1a]">No products in this category</h3>
                <p className="text-xs text-muted-foreground mt-1">We're preparing fresh batches — check back soon!</p>
                <button
                  onClick={() => handleSelectCategory(null)}
                  className="mt-5 btn-ghost text-xs px-6 py-2"
                >
                  View All Products
                </button>
              </div>
            )}

            {/* All categories grid (when nothing selected, show category showcase) */}
            {!selectedCategory && !loading && categories.length > 0 && (
              <div className="mt-10">
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Browse by Category</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.map((cat, idx) => {
                    const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                    const emoji = CATEGORY_EMOJIS[idx % CATEGORY_EMOJIS.length];
                    const count = productCounts[cat.id] || 0;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat)}
                        className={`group bg-gradient-to-br ${color} border rounded-2xl p-5 flex flex-col items-center gap-2.5 text-center hover:scale-105 transition-all duration-300 cursor-pointer`}
                      >
                        <span className="text-3xl group-hover:scale-110 transition-transform">{emoji}</span>
                        <span className="text-xs font-bold text-[#333] leading-snug">{cat.name}</span>
                        {count > 0 && (
                          <span className="text-[9px] text-muted-foreground font-medium">{count} products</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
