import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/apiClient';

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', logo: '' });
  const [status, setStatus] = useState('');

  const fetchBrands = async () => {
    setLoading(true);
    try {
      // In case api has brand endpoints. If not, we fetch/save via standard catalog
      const res = await apiClient.get('/catalog/brands').catch(() => ({ data: [] }));
      setBrands(res.data || []);
    } catch (err) {
      console.warn("Failed to fetch brands from endpoint:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving brand...');
    try {
      await apiClient.post('/catalog/brands', formData);
      setStatus('Brand created successfully!');
      setFormData({ name: '', description: '', logo: '' });
      fetchBrands();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Failed to save brand'}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this brand?")) return;
    try {
      await apiClient.delete(`/catalog/brands/${id}`);
      fetchBrands();
    } catch (err) {
      alert("Failed to delete brand.");
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Create Brand Form */}
      <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm h-fit">
        <h2 className="text-xl font-bold text-[#333] mb-5 font-serif">Create Brand</h2>
        {status && (
          <div className={`p-3 rounded-xl mb-4 text-xs font-semibold border ${status.includes('Error') ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
            {status}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Brand Name *</label>
            <input
              type="text"
              placeholder="e.g. Godavari Kitchens"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-[#333] font-medium"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Logo / Icon URL</label>
            <input
              type="text"
              placeholder="e.g. https://image-url..."
              value={formData.logo}
              onChange={e => setFormData({ ...formData, logo: e.target.value })}
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-[#333] font-medium"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              placeholder="Brand history, description, or slogans..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-[#333] font-medium resize-none"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer border-none"
          >
            Save Brand
          </button>
        </form>
      </div>

      {/* Brands Directory */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#333] font-serif">Brands Directory</h2>
          <span className="badge badge-primary">{brands.length} Registered</span>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading brands directory...</div>
          ) : brands.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">🏷️</span>
              <p className="text-muted-foreground text-xs font-medium">No brands registered. Create one to classify your inventory catalog.</p>
            </div>
          ) : brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-between p-4 bg-[#fafafa] border border-border/50 rounded-2xl hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                {brand.logo ? (
                  <img src={brand.logo} className="w-10 h-10 rounded-xl object-cover border border-border/50 bg-white" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                    {brand.name.substring(0,2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-[#333]">{brand.name}</p>
                  {brand.description && <p className="text-xs text-muted-foreground mt-0.5">{brand.description}</p>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(brand.id)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all text-xs font-bold border border-transparent hover:border-destructive/20 cursor-pointer bg-transparent"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrandManager;
