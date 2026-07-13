import React, { useState } from 'react';

const CategoryManager = ({ 
  categoriesList = [], 
  addCategory, 
  deleteCategory, 
  loadData 
}) => {
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [categoryStatus, setCategoryStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCategoryStatus('Creating...');
    try {
      await addCategory(newCategory);
      setCategoryStatus('Category created!');
      setNewCategory({ name: '', description: '' });
      loadData();
      setTimeout(() => setCategoryStatus(''), 3000);
    } catch (err) {
      setCategoryStatus(`Error: ${err.message || 'Failed to create category'}`);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products in this category will not be deleted.`)) return;
    try {
      await deleteCategory(cat.id);
      loadData();
    } catch (err) {
      alert(`Error deleting: ${err.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Create Category Form */}
      <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm h-fit">
        <h2 className="text-xl font-bold text-[#333] mb-5">Create Category</h2>
        {categoryStatus && (
          <div className={`p-3 rounded-xl mb-4 text-sm font-semibold border ${categoryStatus.includes('Error') ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
            {categoryStatus}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category Name *</label>
            <input
              type="text"
              placeholder="e.g. Traditional Sweets"
              value={newCategory.name}
              onChange={e => setNewCategory({ ...newCategory, name: e.target.value })}
              required
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-[#333] font-medium"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              placeholder="Optional description..."
              value={newCategory.description}
              onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
              rows="2"
              className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-[#333] font-medium resize-none"
            />
          </div>
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer border-none"
          >
            Create Category
          </button>
        </form>
      </div>

      {/* Categories List */}
      <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-[#333]">All Categories</h2>
          <span className="badge badge-primary">{categoriesList.length} Total</span>
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1">
          {categoriesList.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">📂</span>
              <p className="text-muted-foreground text-sm">No categories yet. Create one to get started.</p>
            </div>
          ) : categoriesList.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-4 bg-[#fafafa] border border-border/50 rounded-2xl hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  {['🍬','🍮','🧆','🍯','🌶️','🎁','🌾','🍟','🍡','🥮'][idx % 10]}
                </div>
                <div>
                  <p className="font-bold text-sm text-[#333]">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>}
                  <p className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{cat.slug}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(cat)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all text-xs font-bold border border-transparent hover:border-destructive/20 cursor-pointer"
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

export default CategoryManager;
