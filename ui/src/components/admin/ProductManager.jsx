import React, { useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender 
} from '@tanstack/react-table';

const ProductManager = ({
  products = [],
  categoriesList = [],
  addProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  openAssetLibrary,
  loadData
}) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', price: '', image_url: '', description: '', featured: false, admin_note: '', baseSku: '', categoryId: '' 
  });
  const [status, setStatus] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [variantsList, setVariantsList] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [prodGlobalFilter, setProdGlobalFilter] = useState('');
  const [prodSorting, setProdSorting] = useState([]);
  const [prodPagination, setProdPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const handleProductChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    setStatus('Uploading image to backend...');
    try {
      const uploadData = await uploadImage(file);
      if (uploadData?.url) {
        setFormData(prev => ({ ...prev, image_url: uploadData.url }));
        setStatus('Image uploaded successfully!');
      } else {
        throw new Error('No URL returned');
      }
    } catch (err) {
      setStatus(`Error uploading image: ${err.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const startEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || '',
      price: p.basePrice || p.price || '',
      image_url: p.image_url || p.images?.[0]?.url || '',
      description: p.description || '',
      featured: p.isFeatured || p.featured || false,
      admin_note: p.admin_note || '',
      baseSku: p.baseSku || '',
      categoryId: p.categories?.[0]?.categoryId || p.categoryId || ''
    });
    setVariantsList(p.variants || []);
    setIsProductModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this confection product?")) return;
    try {
      await deleteProduct(id);
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setStatus('Processing...');
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        variants: variantsList.map(v => ({ ...v, price: parseFloat(v.price) }))
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setStatus('Product updated!');
      } else {
        await addProduct(payload);
        setStatus('Product published!');
      }
      loadData();
      setTimeout(() => {
        setStatus('');
        setIsProductModalOpen(false);
      }, 1000);
    } catch (err) {
      setStatus(`Error: ${err.message || 'Action failed'}`);
    }
  };

  const productColumns = useMemo(() => [
    {
      accessorKey: 'image_url',
      header: 'Photo',
      cell: info => {
        const url = info.getValue() || info.row.original.images?.[0]?.url;
        return (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#fafafa] border border-border/40 shrink-0">
            <img src={url || 'https://placehold.co/40x40/f8f4f0/BA242A?text=Sweet'} alt="" className="w-full h-full object-cover" />
          </div>
        );
      }
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: info => (
        <div>
          <p className="font-bold text-[#333] text-xs">{info.getValue()}</p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{info.row.original.baseSku}</p>
        </div>
      )
    },
    {
      accessorKey: 'basePrice',
      header: 'Base Price',
      cell: info => {
        const val = info.getValue() ?? info.row.original.price;
        return <span className="font-bold text-[#222]">₹{Number(val || 0).toFixed(0)}</span>;
      }
    },
    {
      accessorKey: 'admin_note',
      header: 'Badge / Status',
      cell: info => info.getValue() ? (
        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{info.getValue()}</span>
      ) : (
        <span className="text-[10px] text-muted-foreground/60 italic">No custom badge</span>
      )
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => (
        <div className="flex gap-2">
          <button 
            onClick={() => startEdit(info.row.original)}
            className="px-3 py-1.5 bg-[#fafafa] hover:bg-primary hover:text-white border border-border rounded-lg text-xs font-bold text-[#333] transition-all cursor-pointer"
          >
            Edit
          </button>
          <button 
            onClick={() => handleDelete(info.row.original.id)}
            className="px-3 py-1.5 bg-[#fafafa] hover:bg-destructive hover:text-white border border-border rounded-lg text-xs font-bold text-destructive transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      )
    }
  ], [categoriesList, products]);

  const productTable = useReactTable({
    data: products,
    columns: productColumns,
    state: {
      globalFilter: prodGlobalFilter,
      sorting: prodSorting,
      pagination: prodPagination,
    },
    onGlobalFilterChange: setProdGlobalFilter,
    onSortingChange: setProdSorting,
    onPaginationChange: setProdPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[70vh] animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-serif text-[#333]">Inventory Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">Add, update, or feature confections in the storefront catalog.</p>
        </div>
        <button 
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: '', image_url: '', description: '', featured: false, admin_note: '', baseSku: '', categoryId: categoriesList[0]?.id || '' });
            setVariantsList([]);
            setIsProductModalOpen(true);
          }}
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] hover:scale-102 active:scale-98 cursor-pointer border-none"
        >
          + Add Confection
        </button>
      </div>
      
      {/* Search & Filter Controls for Products */}
      <div className="mb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <input 
          type="text"
          value={prodGlobalFilter}
          onChange={e => setProdGlobalFilter(e.target.value)}
          placeholder="🔍 Search confections by Name or Status Note..."
          className="bg-[#fafafa] border border-border rounded-xl px-4 py-2.5 text-xs text-[#333] placeholder:text-muted-foreground/60 w-full md:w-96 focus:outline-none focus:border-primary font-medium shadow-sm"
        />
        {prodGlobalFilter && (
          <button 
            onClick={() => setProdGlobalFilter('')}
            className="text-xs text-primary font-bold hover:underline self-end md:self-auto cursor-pointer bg-transparent border-none"
          >
            Clear Search
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-border/50 rounded-2xl bg-white shadow-sm flex-1">
        <table className="w-full text-left">
          <thead>
            {productTable.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-border bg-[#fafafa]/50 text-muted-foreground text-xs uppercase tracking-wider">
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id} 
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={`p-4 font-bold ${header.column.getCanSort() ? 'cursor-pointer hover:text-primary select-none' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 justify-start">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-[10px] opacity-75">
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted()] || ' ↕️'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {productTable.getRowModel().rows.map(row => (
              <tr key={row.id} className="border-b border-border/40 hover:bg-neutral-50/50 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4 text-xs font-medium text-[#333]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {productTable.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-10 text-muted-foreground text-sm font-medium">
                  No matching confections found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
        <div className="text-xs text-muted-foreground font-medium">
          Showing page <span className="text-primary font-black">{productTable.getState().pagination.pageIndex + 1}</span> of <span className="font-black text-[#333]">{productTable.getPageCount() || 1}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-bold">Rows per page:</span>
          <select 
            value={productTable.getState().pagination.pageSize}
            onChange={e => productTable.setPageSize(Number(e.target.value))}
            className="bg-white border border-border rounded-lg text-xs px-2 py-1 focus:outline-none cursor-pointer"
          >
            {[5, 10, 20, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => productTable.previousPage()}
              disabled={!productTable.getCanPreviousPage()}
              className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-muted-foreground hover:text-[#333] hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => productTable.nextPage()}
              disabled={!productTable.getCanNextPage()}
              className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-muted-foreground hover:text-[#333] hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setIsProductModalOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white border border-border rounded-3xl p-6 md:p-8 flex flex-col gap-5 max-h-[92vh] overflow-y-auto z-10 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-bold text-[#333]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#fafafa] border border-border rounded-full hover:bg-black/5 transition-colors text-[#333] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {status && <div className={`p-3 rounded-xl text-sm font-semibold border ${status.includes('Error') ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>{status}</div>}
            
            <form onSubmit={handleProductSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Product Name *</label>
                  <input name="name" placeholder="e.g. Pure Ghee Kajjikayalu" value={formData.name} onChange={handleProductChange} required className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] font-medium text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Base SKU *</label>
                  <input name="baseSku" placeholder="e.g. GHEE-KAJJI-500G" value={formData.baseSku} onChange={handleProductChange} className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] font-medium text-sm font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Price (₹) *</label>
                  <input type="number" step="0.01" name="price" placeholder="e.g. 350.00" value={formData.price} onChange={handleProductChange} required className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] font-medium text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category</label>
                  <select name="categoryId" value={formData.categoryId} onChange={handleProductChange} className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] font-medium text-sm cursor-pointer">
                    <option value="">— Select Category —</option>
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Image Upload */}
              <div className="flex flex-col gap-2 bg-[#fafafa] border border-border rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Product Image</label>
                  <button 
                    type="button" 
                    onClick={() => openAssetLibrary(url => setFormData(prev => ({ ...prev, image_url: url })))}
                    className="text-[10px] text-primary hover:underline font-bold bg-transparent border-none cursor-pointer"
                  >
                    📁 Browse Cloud Library
                  </button>
                </div>
                {formData.image_url ? (
                  <div className="relative group rounded-xl overflow-hidden aspect-square max-w-[130px]">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))} className="bg-destructive text-white px-3 py-1 rounded-full text-xs cursor-pointer border-none">Remove</button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer transition-all bg-white group">
                    {imageUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-primary font-semibold">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center p-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors mb-1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                        </svg>
                        <span className="text-xs text-[#333] font-semibold">Upload Image</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={imageUploading} className="hidden" />
                  </label>
                )}
                <input name="image_url" placeholder="Or paste image URL..." value={formData.image_url} onChange={handleProductChange} className="bg-white border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary text-xs w-full text-[#333]" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea name="description" placeholder="Describe the product..." value={formData.description} onChange={handleProductChange} rows="3" className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium resize-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Admin Alert Badge</label>
                <input name="admin_note" placeholder="e.g. Fresh Kitchen Arrival Today" value={formData.admin_note} onChange={handleProductChange} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-primary placeholder:text-primary/40 text-primary text-sm font-semibold" />
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer font-medium">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleProductChange} className="accent-primary w-4 h-4" />
                Feature on Homepage Carousel
              </label>

              {/* Variants Builder */}
              <div className="flex flex-col gap-3 bg-[#fafafa] border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Variants (optional)</label>
                  <button
                    type="button"
                    onClick={() => setVariantsList(prev => [...prev, { sku: '', price: formData.price, weight: '', size: '' }])}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer bg-transparent border-none"
                  >
                    + Add Variant
                  </button>
                </div>
                {variantsList.map((v, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white border border-border rounded-xl p-3">
                    <input
                      placeholder="SKU (e.g. SKU-500G)"
                      value={v.sku}
                      onChange={e => setVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, sku: e.target.value } : item))}
                      className="border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-[#333] flex-1"
                    />
                    <input
                      type="number"
                      placeholder="Price ₹"
                      value={v.price}
                      onChange={e => setVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, price: e.target.value } : item))}
                      className="border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-[#333] w-24"
                    />
                    <input
                      placeholder="Size/Weight"
                      value={v.size}
                      onChange={e => setVariantsList(prev => prev.map((item, i) => i === idx ? { ...item, size: e.target.value } : item))}
                      className="border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-[#333] w-28"
                    />
                    <button
                      type="button"
                      onClick={() => setVariantsList(prev => prev.filter((_, i) => i !== idx))}
                      className="text-destructive text-xs font-bold hover:bg-destructive/10 px-2 py-1.5 rounded-lg cursor-pointer shrink-0 border-none bg-transparent"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {variantsList.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No variants — product will use base price.</p>
                )}
              </div>

              <div className="flex gap-3 mt-1">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:scale-101 active:scale-98 cursor-pointer border-none">
                  {editingProduct ? 'Update Product' : 'Publish to Storefront'}
                </button>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-6 bg-[#fafafa] border border-border rounded-xl hover:bg-black/5 transition-all text-xs font-bold text-[#333] cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
