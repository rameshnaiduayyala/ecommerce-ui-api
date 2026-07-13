import { useState, useEffect } from 'react';
import { 
  getAdminProducts, addProduct, updateProduct, deleteProduct, 
  getAllOrders, updateOrderStatus, deleteOrder, 
  getStoreSettings, updateStoreSettings, 
  getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, 
  getCoupons, addCoupon, deleteCoupon, toggleCoupon, 
  uploadImage, addCategory, deleteCategory 
} from '../api/admin';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCategories } from '../api/catalog';
import { useAuth } from '../context/AuthContext';

// Import subcomponents
import AdminSidebar from '../components/admin/AdminSidebar';
import DashboardOverview from '../components/admin/DashboardOverview';
import ProductManager from '../components/admin/ProductManager';
import CategoryManager from '../components/admin/CategoryManager';
import OrderManager from '../components/admin/OrderManager';
import AnnouncementManager from '../components/admin/AnnouncementManager';
import CouponManager from '../components/admin/CouponManager';
import SettingsManager from '../components/admin/SettingsManager';
import BrandManager from '../components/admin/BrandManager';
import CustomerManager from '../components/admin/CustomerManager';
import AdminHeader from '../components/admin/AdminHeader';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = location.pathname.split('/').filter(Boolean)[1] || 'overview';
  
  const setActiveTab = (tabId) => {
    navigate(`/admin/${tabId === 'overview' ? '' : tabId}`);
  };

  const { user, signOut } = useAuth();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [orders, setOrders] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [settings, setSettings] = useState({ 
    cod_enabled: true, 
    partial_payment_enabled: false, 
    partial_payment_percent: 50,
    store_name: 'Aha Konaseema',
    origin_address: 'Ravulapalem, East Godavari District, Andhra Pradesh',
    courier_partner: 'Ghee Express Courier',
    support_email: 'admin@rameshayyala.online',
    support_phone: '+91 888 777 6666',
    guarantee_text: 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached'
  });

  // Modal Asset Library State
  const [storageImages, setStorageImages] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [onAssetSelect, setOnAssetSelect] = useState(() => () => {});

  const openAssetLibrary = async (selectCallback) => {
    setOnAssetSelect(() => selectCallback);
    setIsAssetPickerOpen(true);
    setLoadingAssets(true);
    try {
      const list = products
        .map(p => p.image_url || p.images?.[0]?.url)
        .filter(Boolean)
        .map((url, index) => ({ name: `Image ${index + 1}`, url }));
      setStorageImages(list || []);
    } catch (err) {
      console.error("Asset fetch error:", err);
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadData = async () => {
    try {
      const cats = await getCategories();
      setCategoriesList(cats || []);

      if (activeTab === 'overview') {
        const prodData = await getAdminProducts();
        setProducts(prodData || []);
        const ordData = await getAllOrders();
        setOrders(ordData || []);
        const annData = await getAnnouncements();
        setAnnouncements(annData || []);
        const coupData = await getCoupons();
        setCoupons(coupData || []);
      } else if (activeTab === 'products') {
        const data = await getAdminProducts();
        setProducts(data || []);
      } else if (activeTab === 'orders') {
        const data = await getAllOrders();
        setOrders(data || []);
      } else if (activeTab === 'settings') {
        const data = await getStoreSettings();
        if (data) setSettings(data);
      } else if (activeTab === 'announcements') {
        const data = await getAnnouncements();
        setAnnouncements(data || []);
      } else if (activeTab === 'coupons') {
        const data = await getCoupons();
        setCoupons(data || []);
      }
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  // Prefetch dashboard summary data once on mount
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Analytics Helpers
  const getSalesTrendData = () => {
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      trendData.push({ name: dateKey, Sales: 0 });
    }
    if (!orders || orders.length === 0) return trendData;
    orders.forEach(order => {
      const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const bucket = trendData.find(day => day.name === dateStr);
      if (bucket) {
        bucket.Sales = parseFloat((bucket.Sales + (order.total_amount || 0)).toFixed(2));
      }
    });
    return trendData;
  };

  const getOrderStatusData = () => {
    if (!orders || orders.length === 0) return [];
    const counts = { pending: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    orders.forEach(order => {
      const status = (order.status || 'pending').toLowerCase();
      if (counts[status] !== undefined) counts[status]++;
      else counts.pending++;
    });
    return [
      { name: 'Delivered', value: counts.delivered, statusKey: 'delivered' },
      { name: 'Preparing', value: counts.preparing, statusKey: 'preparing' },
      { name: 'Shipped', value: counts.shipped, statusKey: 'shipped' },
      { name: 'Pending', value: counts.pending, statusKey: 'pending' },
      { name: 'Cancelled', value: counts.cancelled, statusKey: 'cancelled' }
    ].filter(item => item.value > 0);
  };

  const getProductSalesData = () => {
    if (!orders || orders.length === 0) return [];
    const itemSales = {};
    orders.forEach(order => {
      (order.order_items || []).forEach(item => {
        const productName = item.products?.name || 'Unknown Item';
        itemSales[productName] = (itemSales[productName] || 0) + (item.quantity || 0);
      });
    });
    return Object.keys(itemSales).map(name => ({ name: name, Sales: itemSales[name] }));
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] print:bg-white text-slate-800">
      
      {/* LEFT SIDEBAR PANEL */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        userEmail={user?.email} 
        onSignOut={signOut} 
      />
      
      {/* RIGHT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* ERP HEADER */}
        <AdminHeader 
          activeTab={activeTab} 
          userEmail={user?.email} 
          onSignOut={signOut}
        />
        
        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 p-8 md:p-12 overflow-y-auto">

        {/* Dynamic Tab Switchboard Views */}
        {activeTab === 'overview' && (
          <DashboardOverview 
            products={products}
            orders={orders}
            announcements={announcements}
            coupons={coupons}
            salesTrendData={getSalesTrendData()}
            orderStatusData={getOrderStatusData()}
            productSalesData={getProductSalesData()}
          />
        )}

        {activeTab === 'products' && (
          <ProductManager 
            products={products}
            categoriesList={categoriesList}
            addProduct={addProduct}
            updateProduct={updateProduct}
            deleteProduct={deleteProduct}
            uploadImage={uploadImage}
            openAssetLibrary={openAssetLibrary}
            loadData={loadData}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager 
            categoriesList={categoriesList}
            addCategory={addCategory}
            deleteCategory={deleteCategory}
            loadData={loadData}
          />
        )}

        {activeTab === 'brands' && (
          <BrandManager />
        )}

        {activeTab === 'customers' && (
          <CustomerManager />
        )}

        {activeTab === 'orders' && (
          <OrderManager 
            orders={orders}
            settings={settings}
            updateOrderStatus={updateOrderStatus}
            deleteOrder={deleteOrder}
            loadData={loadData}
          />
        )}

        {activeTab === 'announcements' && (
          <AnnouncementManager 
            announcements={announcements}
            addAnnouncement={addAnnouncement}
            updateAnnouncement={updateAnnouncement}
            deleteAnnouncement={deleteAnnouncement}
            loadData={loadData}
          />
        )}

        {activeTab === 'coupons' && (
          <CouponManager 
            coupons={coupons}
            addCoupon={addCoupon}
            deleteCoupon={deleteCoupon}
            toggleCoupon={toggleCoupon}
            loadData={loadData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager 
            settings={settings}
            setSettings={setSettings}
            updateStoreSettings={updateStoreSettings}
            uploadImage={uploadImage}
            openAssetLibrary={openAssetLibrary}
          />
        )}
      </main>
      </div>

      {/* Shared Asset Library Picker Modal overlay */}
      {isAssetPickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-3xl border border-border/50 p-6 flex flex-col gap-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-[#333] flex items-center gap-2 font-serif">
                  📁 Cloud Asset Library
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Select an existing image from your bucket or upload a new one.</p>
              </div>
              <button 
                onClick={() => setIsAssetPickerOpen(false)}
                className="text-muted-foreground hover:text-[#333] text-lg font-bold p-2 cursor-pointer bg-transparent border-none outline-none"
              >
                ✕
              </button>
            </div>

            {/* Grid of assets */}
            <div className="flex-1 overflow-y-auto min-h-[300px] pr-2">
              {loadingAssets ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-pulse py-20">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span>Scanning cloud repository...</span>
                </div>
              ) : storageImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {storageImages.map((img) => (
                    <div 
                      key={img.name} 
                      onClick={() => {
                        onAssetSelect(img.url);
                        setIsAssetPickerOpen(false);
                      }}
                      className="group relative cursor-pointer border border-border/60 hover:border-primary/50 bg-[#fafafa] hover:bg-white rounded-2xl p-2 transition-all flex flex-col gap-2 justify-between shadow-sm hover:shadow-md"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-black/5 relative">
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] bg-primary text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Select</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center block px-1 font-medium">{img.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20 gap-2">
                  <span>No uploaded items found in the Supabase bucket.</span>
                  <span className="text-xs text-muted-foreground/60">Upload new ones to start building your repository.</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between gap-4 items-center">
              <label className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-98">
                Upload custom new image
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setLoadingAssets(true);
                    try {
                      const uploadData = await uploadImage(file);
                      if (!uploadData?.url) throw new Error('No URL returned');
                      onAssetSelect(uploadData.url);
                      setIsAssetPickerOpen(false);
                    } catch (err) {
                      console.error(err);
                      alert("Asset upload failed.");
                    } finally {
                      setLoadingAssets(false);
                    }
                  }}
                />
              </label>

              <button 
                onClick={() => setIsAssetPickerOpen(false)}
                className="px-6 py-2.5 rounded-full border border-border text-[#333] hover:bg-[#fafafa] text-xs font-bold transition-all cursor-pointer"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
