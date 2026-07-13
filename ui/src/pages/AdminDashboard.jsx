import { useState, useEffect, useMemo } from 'react';
import { getAdminProducts, addProduct, updateProduct, deleteProduct, getAllOrders, updateOrderStatus, deleteOrder, getStoreSettings, updateStoreSettings, getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, getCoupons, addCoupon, deleteCoupon, toggleCoupon, uploadImage, addCategory, updateCategory, deleteCategory } from '../api/admin';
import { getCategories } from '../api/catalog';
import { EmailTemplates } from '../notifications/emailService';
import { pushService } from '../notifications/pushService';
import { SalesTrendChart, OrderStatusChart, ProductDistributionChart } from '../components/AdminCharts';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender 
} from '@tanstack/react-table';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // default to analytical overview
  
  // Products State
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    image_url: '', 
    description: '', 
    featured: false, 
    admin_note: '', 
    baseSku: '', 
    categoryId: '' 
  });
  const [status, setStatus] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  
  // Categories State
  const [categoriesList, setCategoriesList] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [categoryStatus, setCategoryStatus] = useState('');

  // Variants State
  const [variantsList, setVariantsList] = useState([]);
  
  // Orders State
  const [orders, setOrders] = useState([]);

  // Settings State
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
  const [settingsStatus, setSettingsStatus] = useState('');
  const [newHeroSlide, setNewHeroSlide] = useState({ title: '', description: '', image_url: '' });
  const [slideUploading, setSlideUploading] = useState(false);
  
  // Asset Library State
  const [storageImages, setStorageImages] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const [onAssetSelect, setOnAssetSelect] = useState(() => () => {});

  const openAssetLibrary = async (selectCallback) => {
    setOnAssetSelect(() => selectCallback);
    setIsAssetPickerOpen(true);
    setLoadingAssets(true);
    try {
      // Fallback: list unique images from our products list
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
  
  // Order Edits State (Drafts)
  const [orderEdits, setOrderEdits] = useState({});

  // Announcements State
  const [announcements, setAnnouncements] = useState([]);
  const [newAnn, setNewAnn] = useState({ text: '', type: 'info', is_active: true });
  const [annStatus, setAnnStatus] = useState('');

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: 0, is_active: true });
  const [couponStatus, setCouponStatus] = useState('');
  const [selectedFulfillmentOrder, setSelectedFulfillmentOrder] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  
  // Recharts dynamic analytics processors
  const getSalesTrendData = () => {
    // Generate empty buckets for the last 7 calendar days dynamically
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short' 
      });
      trendData.push({ name: dateKey, Sales: 0 });
    }

    if (!orders || orders.length === 0) return trendData;

    orders.forEach(order => {
      const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short' 
      });
      const bucket = trendData.find(day => day.name === dateStr);
      if (bucket) {
        bucket.Sales = parseFloat((bucket.Sales + (order.total_amount || 0)).toFixed(2));
      }
    });

    return trendData;
  };

  const getOrderStatusData = () => {
    if (!orders || orders.length === 0) return [];
    
    const counts = {
      pending: 0,
      preparing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };
    
    orders.forEach(order => {
      const status = (order.status || 'pending').toLowerCase();
      if (counts[status] !== undefined) {
        counts[status]++;
      } else {
        counts.pending++;
      }
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
    
    return Object.keys(itemSales).map(name => ({
      name: name,
      Sales: itemSales[name]
    }));
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
        setProducts(data);
      } else if (activeTab === 'orders') {
        const data = await getAllOrders();
        setOrders(data);
      } else if (activeTab === 'settings') {
        const data = await getStoreSettings();
        if (data) setSettings(data);
      } else if (activeTab === 'announcements') {
        const data = await getAnnouncements();
        setAnnouncements(data);
      } else if (activeTab === 'coupons') {
        const data = await getCoupons();
        setCoupons(data);
      } else if (activeTab === 'categories') {
        // Already loaded cats at top of method
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pre-load all listings once for the Executive Quick Stats counters
  useEffect(() => {
    const loadStats = async () => {
      try {
        const cats = await getCategories();
        setCategoriesList(cats || []);
        const prodData = await getAdminProducts();
        setProducts(prodData || []);
        const ordData = await getAllOrders();
        setOrders(ordData || []);
        const annData = await getAnnouncements();
        setAnnouncements(annData || []);
        const coupData = await getCoupons();
        setCoupons(coupData || []);
      } catch (err) {
        console.error("Dashboard overview prefetch error:", err);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
        throw new Error('Image URL not returned from backend');
      }
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error("Storage upload error:", err);
      setStatus(`Failed to upload image: ${err.message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const exportOrdersToCSV = () => {
    if (orders.length === 0) {
      alert("No orders available to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Date",
      "Customer Name",
      "Customer Email",
      "Shipping Address",
      "City",
      "Postal Code",
      "Country",
      "Ordered Items (QTY)",
      "Total Amount (INR)",
      "Status",
      "Dispatch Note"
    ];

    const csvRows = [
      headers.join(","),
      ...orders.map(order => {
        const addr = order.shipping_address || {};
        const custName = addr.firstName ? `${addr.firstName} ${addr.lastName}` : 'Guest Checkout';
        const userEmail = order.users?.email || 'N/A';
        const fullAddr = `"${(addr.address || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const city = `"${(addr.city || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const postalCode = addr.postalCode || '';
        const country = addr.country || 'India';
        
        const itemsFlattened = (order.order_items || [])
          .map(item => `${item.products?.name || 'Item'} (${item.quantity})`)
          .join(" | ");
        const itemsCSV = `"${itemsFlattened.replace(/"/g, '""')}"`;
        const status = order.status || 'pending';
        const adminNote = `"${(order.admin_note || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        const total = order.total_amount || 0;
        const date = new Date(order.created_at).toLocaleString().replace(/,/g, '');

        return [
          order.id,
          date,
          `"${custName.replace(/"/g, '""')}"`,
          `"${userEmail.replace(/"/g, '""')}"`,
          fullAddr,
          city,
          postalCode,
          country,
          itemsCSV,
          total,
          status,
          adminNote
        ].join(",");
      })
    ];

    const csvContent = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `aha_konaseema_orders_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProductChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        baseSku: formData.baseSku || formData.name.toLowerCase().replace(/\s+/g, '-'),
        basePrice: parseFloat(formData.price),
        status: "PUBLISHED",
        categories: formData.categoryId ? [formData.categoryId] : [],
        images: formData.image_url ? [{ url: formData.image_url, altText: formData.name }] : [],
        variants: variantsList.map(v => ({
          sku: v.sku || `${formData.baseSku || 'SKU'}-${variantsList.indexOf(v) + 1}`,
          price: parseFloat(v.price) || parseFloat(formData.price),
          weight: parseFloat(v.weight) || undefined,
          attributeValues: { Weight: v.size || 'Standard' }
        }))
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        setStatus('Product updated!');
      } else {
        await addProduct(payload);
        setStatus('Product added!');

        // Trigger push notification to all subscribed users
        try {
          await pushService.sendPushNotification({
            userId: 'all',
            title: 'New Sweets Alert! 🍬✨',
            message: `Freshly prepared "${payload.name}" has been added to our shop. Try it today!`,
            url: `${window.location.origin}/products`
          });
        } catch (pushErr) {
          console.warn("Failed to trigger product launch push notification", pushErr);
        }
      }
      
      setFormData({ name: '', price: '', image_url: '', description: '', featured: false, admin_note: '', baseSku: '', categoryId: '' });
      setEditingProduct(null);
      setVariantsList([]);
      setIsProductModalOpen(false);
      loadData();
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setStatus(`Error saving product: ${err.message || err.details || 'Please check validation requirements.'}`);
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.basePrice || product.price || '',
      image_url: product.image_url || product.images?.[0]?.url || '',
      description: product.description || '',
      featured: product.featured || false,
      admin_note: product.admin_note || '',
      baseSku: product.baseSku || '',
      categoryId: product.categories?.[0]?.categoryId || ''
    });
    setVariantsList(product.variants?.map(v => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      weight: v.weight || '',
      size: v.attributeValues?.Weight || ''
    })) || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      await deleteProduct(id);
      loadData();
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Send status update email if the order exists, status has changed, and user has email
      const originalOrder = orders.find(o => o.id === orderId);
      if (originalOrder && originalOrder.status !== newStatus && originalOrder.users?.email) {
        try {
          console.log(`Sending quick status update email to ${originalOrder.users.email}...`);
          
          const details = {
            orderId: orderId,
            date: originalOrder.created_at,
            customerName: originalOrder.users?.full_name || (originalOrder.shipping_address?.firstName + ' ' + originalOrder.shipping_address?.lastName) || 'Customer',
            shippingAddress: `${originalOrder.shipping_address?.address}, ${originalOrder.shipping_address?.city}, ${originalOrder.shipping_address?.postalCode}, ${originalOrder.shipping_address?.country}`,
            phone: originalOrder.shipping_address?.phone || '',
            items: originalOrder.order_items.map(item => ({
              name: item.products?.name,
              image_url: item.products?.image_url,
              quantity: item.quantity,
              price: item.price_at_time
            })),
            subtotal: originalOrder.total_amount,
            discount: 0,
            shipping: 0,
            grandTotal: originalOrder.total_amount,
            paymentMethod: 'Prepaid',
            origin: window.location.origin
          };

          await EmailTemplates.sendOrderStatusUpdate(
            originalOrder.users.email, 
            details, 
            newStatus, 
            originalOrder.admin_note || ''
          );

          // Send push notification status update to the customer
          try {
            await pushService.sendPushNotification({
              userId: originalOrder.user_id,
              title: 'Order Status Updated! 📦',
              message: `Your order #${orderId.slice(0, 8).toUpperCase()} is now ${newStatus.toUpperCase()}!`,
              url: `${window.location.origin}/orders`
            });
          } catch (pushErr) {
            console.warn("Failed to send status update push notification", pushErr);
          }
        } catch (emailErr) {
          console.warn("Failed to send status update email/push. Status was still updated in DB.", emailErr);
        }
      }

      loadData();
    } catch (err) {
      console.error(err);
      alert("Error updating order status");
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsStatus('Saving...');
    try {
      await updateStoreSettings(settings);
      setSettingsStatus('Settings updated successfully!');
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setSettingsStatus('Error saving settings.');
    }
  };

  const handleOrderNoteUpdate = async (orderId, note) => {
    try {
      const originalOrder = orders.find(o => o.id === orderId);
      const currentStatus = originalOrder?.status || 'PENDING';
      await updateOrderStatus(orderId, currentStatus.toUpperCase(), note);
      setSettingsStatus('Order note saved');
      setTimeout(() => setSettingsStatus(''), 2000);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveOrderChanges = async (orderId) => {
    const draft = orderEdits[orderId];
    if (!draft) return; // No changes made
    
    setSettingsStatus('Saving order changes...');
    try {
      await updateOrderStatus(orderId, draft.status.toUpperCase(), draft.admin_note);
      
      // Find the original order to check if status changed and get customer email
      const originalOrder = orders.find(o => o.id === orderId);
      if (originalOrder && originalOrder.status !== draft.status && originalOrder.users?.email) {
        try {
          console.log(`Sending status update email to ${originalOrder.users.email}...`);
          
          const details = {
            orderId: orderId,
            date: originalOrder.created_at,
            customerName: originalOrder.users?.full_name || (originalOrder.shipping_address?.firstName + ' ' + originalOrder.shipping_address?.lastName) || 'Customer',
            shippingAddress: `${originalOrder.shipping_address?.address}, ${originalOrder.shipping_address?.city}, ${originalOrder.shipping_address?.postalCode}, ${originalOrder.shipping_address?.country}`,
            phone: originalOrder.shipping_address?.phone || '',
            items: originalOrder.order_items.map(item => ({
              name: item.products?.name,
              image_url: item.products?.image_url,
              quantity: item.quantity,
              price: item.price_at_time
            })),
            subtotal: originalOrder.total_amount,
            discount: 0,
            shipping: 0,
            grandTotal: originalOrder.total_amount,
            paymentMethod: 'Prepaid',
            origin: window.location.origin
          };

          await EmailTemplates.sendOrderStatusUpdate(
            originalOrder.users.email, 
            details, 
            draft.status, 
            draft.admin_note
          );

          // Send push notification status update to the customer
          try {
            await pushService.sendPushNotification({
              userId: originalOrder.user_id,
              title: 'Order Status Updated! 📦',
              message: `Your order #${orderId.slice(0, 8).toUpperCase()} is now ${draft.status.toUpperCase()}!${draft.admin_note ? ' Note: ' + draft.admin_note : ''}`,
              url: `${window.location.origin}/orders`
            });
          } catch (pushErr) {
            console.warn("Failed to send status update push notification", pushErr);
          }
        } catch (emailErr) {
          console.warn("Failed to send status update email/push. Status was still updated in DB.", emailErr);
        }
      }

      setSettingsStatus('Order updated successfully!');
      // Remove draft from local state after saving
      const updatedEdits = { ...orderEdits };
      delete updatedEdits[orderId];
      setOrderEdits(updatedEdits);
      
      loadData(); // Sync up from server
      setTimeout(() => setSettingsStatus(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Error updating order");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to permanently delete this order? This cannot be undone.")) {
      try {
        await deleteOrder(orderId);
        loadData();
      } catch (err) {
        console.error(err);
        alert("Error deleting order");
      }
    }
  };

  // Announcements Actions
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setAnnStatus(editingAnn ? 'Updating...' : 'Publishing...');
    try {
      if (editingAnn) {
        await updateAnnouncement(editingAnn.id, newAnn);
        setEditingAnn(null);
        setAnnStatus('Flash update updated!');
      } else {
        await addAnnouncement(newAnn);
        setAnnStatus('Flash update published!');
      }
      setNewAnn({ text: '', type: 'info', is_active: true });
      setIsAnnModalOpen(false);
      loadData();
      setTimeout(() => setAnnStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setAnnStatus('Error publishing announcement.');
    }
  };

  const handleAnnToggle = async (id, currentStatus) => {
    try {
      await updateAnnouncement(id, { is_active: !currentStatus });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnnDelete = async (id) => {
    if (window.confirm("Delete this flash update?")) {
      try {
        await deleteAnnouncement(id);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Coupons Actions
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    setCouponStatus('Publishing coupon...');
    try {
      const payload = {
        code: newCoupon.code.toUpperCase(),
        discount_type: newCoupon.discount_type,
        discount_value: parseFloat(newCoupon.discount_value),
        min_order_value: parseFloat(newCoupon.min_order_value),
        is_active: newCoupon.is_active
      };
      await addCoupon(payload);
      setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '', min_order_value: 0, is_active: true });
      setCouponStatus('Coupon published successfully!');
      loadData();
      setTimeout(() => setCouponStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setCouponStatus('Error creating coupon.');
    }
  };

  const handleCouponToggle = async (code, currentStatus) => {
    try {
      const coup = coupons.find(c => c.code === code);
      if (coup?.id) {
        await toggleCoupon(coup.id, !currentStatus);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCouponDelete = async (code) => {
    if (window.confirm(`Delete coupon "${code}"?`)) {
      try {
        await deleteCoupon(code);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // TanStack Table states
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

  const orderColumns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Order ID',
      cell: info => {
        const id = info.getValue();
        return <span className="font-mono text-xs text-primary font-bold">#{id.split('-')[0].toUpperCase()}</span>;
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Date',
      cell: info => new Date(info.getValue()).toLocaleDateString()
    },
    {
      id: 'customer',
      header: 'Customer Details',
      accessorFn: row => {
        const addr = row.shipping_address || {};
        return addr.firstName ? `${addr.firstName} ${addr.lastName} ${row.users?.email || ''}` : `Guest Checkout ${row.users?.email || ''}`;
      },
      cell: info => {
        const row = info.row.original;
        const addr = row.shipping_address || {};
        const custName = addr.firstName ? `${addr.firstName} ${addr.lastName}` : 'Guest Checkout';
        return (
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#333]">{custName}</span>
            <span className="text-[10px] text-muted-foreground">{row.users?.email || 'N/A'}</span>
          </div>
        );
      }
    },
    {
      id: 'items',
      header: 'Ordered Items',
      accessorFn: row => row.order_items?.map(item => item.products?.name).join(' ') || '',
      cell: info => {
        const row = info.row.original;
        return (
          <div className="text-xs text-muted-foreground">
            {row.order_items?.map((item, i) => (
              <div key={i} className="flex gap-1.5 items-center my-0.5 font-medium">
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black border border-primary/20">
                  {item.quantity}x
                </span>
                <span>{item.products?.name}</span>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      accessorKey: 'total_amount',
      header: 'Payment Total',
      cell: info => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-[#333]">₹{info.getValue()}</span>
          <span className="text-[9px] text-emerald-600 font-bold font-mono">Paid / COD Pending</span>
        </div>
      )
    },
    {
      id: 'actions',
      header: 'Fulfillment Actions',
      cell: info => {
        const order = info.row.original;
        const { orderEdits, setOrderEdits, setSelectedFulfillmentOrder, handleSaveOrderChanges, handleDeleteOrder } = info.table.options.meta || {};
        const draft = orderEdits?.[order.id] || { 
          status: order.status, 
          admin_note: order.admin_note || '' 
        };
        const hasChanges = orderEdits?.[order.id] !== undefined;

        return (
          <div className="flex flex-col gap-2 items-center">
            <div className="flex gap-2 w-full justify-center flex-wrap">
              <select 
                value={draft.status} 
                onChange={(e) => setOrderEdits({
                  ...orderEdits,
                  [order.id]: { ...draft, status: e.target.value }
                })}
                className={`bg-white text-xs rounded-lg px-2.5 py-1 border focus:outline-none cursor-pointer ${
                  draft.status === 'delivered' ? 'border-green-500 text-green-500' :
                  draft.status === 'processing' ? 'border-yellow-500 text-yellow-500' :
                  draft.status === 'cancelled' ? 'border-destructive text-destructive' :
                  'border-border'
                }`}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button 
                onClick={() => setSelectedFulfillmentOrder(order)}
                className="flex items-center gap-1 bg-white border border-border hover:bg-neutral-50 text-muted-foreground hover:text-[#333] font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all active:scale-98 cursor-pointer"
              >
                📋 Docket
              </button>

              <button 
                onClick={() => window.open('/print/packing-slip/' + order.id, '_blank')}
                className="flex items-center gap-1 bg-white border border-border hover:bg-primary hover:text-white text-muted-foreground rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
              >
                📦 Slip
              </button>

              <button 
                onClick={() => window.open('/print/invoice/' + order.id, '_blank')}
                className="flex items-center gap-1 bg-white border border-border hover:bg-primary hover:text-white text-muted-foreground rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
              >
                🧾 Invoice
              </button>

              <button 
                onClick={() => handleDeleteOrder(order.id)}
                className="flex items-center gap-1 bg-white border border-border hover:bg-destructive hover:text-white text-destructive font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition-all active:scale-98 cursor-pointer"
                title="Delete Order"
              >
                🗑️ Delete
              </button>
            </div>

            <input 
              type="text" 
              placeholder="Add packaging instructions / dispatch note..."
              value={draft.admin_note}
              onChange={(e) => setOrderEdits({
                ...orderEdits,
                [order.id]: { ...draft, admin_note: e.target.value }
              })}
              className="bg-[#fafafa] border border-border text-[#333] text-[10px] rounded-lg px-3 py-1.5 focus:outline-none placeholder:text-muted-foreground/50 w-full focus:border-primary"
            />

            {hasChanges && (
              <button 
                onClick={() => handleSaveOrderChanges(order.id)} 
                className="bg-primary hover:bg-primary/95 text-white text-[10px] font-bold py-2 px-3 rounded-lg transition-all w-full shadow-sm cursor-pointer"
              >
                Save Fulfillment Status
              </button>
            )}
          </div>
        );
      }
    }
  ], []);

  const orderTable = useReactTable({
    data: orders,
    columns: orderColumns,
    state: {
      globalFilter,
      sorting,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      orderEdits,
      setOrderEdits,
      setSelectedFulfillmentOrder,
      handleSaveOrderChanges,
      handleDeleteOrder,
    }
  });

  // TanStack Table states for products
  const [prodGlobalFilter, setProdGlobalFilter] = useState('');
  const [prodSorting, setProdSorting] = useState([]);
  const [prodPagination, setProdPagination] = useState({ pageIndex: 0, pageSize: 5 });

  const productColumns = useMemo(() => [
    {
      id: 'thumbnail',
      header: 'Image',
      cell: info => {
        const product = info.row.original;
        return (
          <img 
            src={product.image_url || `https://placehold.co/100x100/F5F5F5/BA242A?text=${product.name.charAt(0)}`} 
            alt={product.name}
            className="w-12 h-12 rounded-lg object-contain bg-white border border-border/50" 
          />
        );
      }
    },
    {
      accessorKey: 'name',
      header: 'Confection Product',
      cell: info => {
        const product = info.row.original;
        return (
          <div>
            <h3 className="font-bold text-[#333] flex items-center gap-2 flex-wrap">
              {product.name}
              {product.featured && <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-black uppercase border border-amber-200">Featured</span>}
              {product.admin_note && <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold border border-primary/20">Alert Badge Active</span>}
            </h3>
          </div>
        );
      }
    },
    {
      accessorKey: 'price',
      header: 'Price (₹ INR)',
      cell: info => <span className="font-black text-[#333]">₹{info.getValue()}</span>
    },
    {
      accessorKey: 'admin_note',
      header: 'Status/Alert Note',
      cell: info => {
        const note = info.getValue();
        return note ? (
          <span className="text-xs text-muted-foreground italic max-w-[200px] truncate block" title={note}>
            "{note}"
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40 font-medium">None</span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const product = info.row.original;
        const { startEdit, setIsProductModalOpen, handleDelete } = info.table.options.meta || {};
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                startEdit(product);
                setIsProductModalOpen(true);
              }} 
              className="px-3.5 py-1.5 bg-white border border-border hover:bg-primary hover:text-white text-muted-foreground rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
            >
              Edit Item
            </button>
            <button 
              onClick={() => handleDelete(product.id)} 
              className="px-3.5 py-1.5 bg-white border border-border hover:bg-destructive hover:text-white text-destructive rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
            >
              Delete
            </button>
          </div>
        );
      }
    }
  ], []);

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
    getFilteredRowModel: getFilteredRowModel(),
    meta: {
      startEdit,
      setIsProductModalOpen,
      handleDelete,
    }
  });

  return (
    <>
      <div className="container mx-auto px-4 py-12 print:hidden retro-grid-bg min-h-screen relative">
        {/* Executive Welcome & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-black shimmer-text tracking-tight pb-1">
            Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">Welcome back, Administrator. The Godavari kitchens are active and online.</p>
        </div>
        
        {/* Navigation Tabs Pillbox */}
        <div className="flex flex-wrap gap-2.5 bg-white border border-border/80 p-1.5 rounded-2xl shadow-sm">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'overview' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
            </svg>
            <span>Overview</span>
          </button>

          <button 
            onClick={() => setActiveTab('products')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'products' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span>Catalog</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'orders' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m1.875-12h7.5M20.25 9h-7.5m7.5 3h-7.5m7.5 3h-7.5M2.25 4.5A2.25 2.25 0 0 1 4.5 2.25h15A2.25 2.25 0 0 1 21.75 4.5v15a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25v-15Z" />
            </svg>
            <span>Orders</span>
          </button>
 
          <button 
            onClick={() => setActiveTab('announcements')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'announcements' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
            <span>Flash Updates</span>
          </button>
 
          <button 
            onClick={() => setActiveTab('coupons')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'coupons' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.103-5.103a2.25 2.25 0 0 0 0-3.181l-9.582-9.584A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>           </button>
 
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            <span>Categories</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-primary text-white shadow-md scale-102' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span>Settings</span>
          </button>
        </div>
      </div>
 
      {/* Executive Quick Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            📦
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Total Catalog</span>
          <span className="text-xl font-black text-[#333]">{products.length} Products</span>
        </div>
        
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            📊
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Store Orders</span>
          <span className="text-xl font-black text-[#333]">{orders.length} Placed</span>
        </div>
 
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            ⚡
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Flash Alerts</span>
          <span className="text-xl font-black text-[#333]">
            {announcements.filter(a => a.is_active).length} Active
          </span>
        </div>
 
        <div className="magic-glow-card glow-hover p-5 rounded-2xl border border-border/60 shadow-sm relative overflow-hidden flex flex-col gap-1 transition-all duration-300">
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-sm font-black text-primary">
            🎟️
          </div>
          <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Coupon Campaign</span>
          <span className="text-xl font-black text-[#333]">
            {coupons.filter(c => c.is_active).length} Active
          </span>
        </div>
      </div>
 
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6 animate-fade-in mb-12">
          {/* Top Main Sales Trend Area Chart */}
          <div className="w-full">
            <SalesTrendChart data={getSalesTrendData()} />
          </div>
          
          {/* Side-by-side breakdown charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderStatusChart data={getOrderStatusData()} />
            <ProductDistributionChart data={getProductSalesData()} />
          </div>
        </div>
      )}

      {activeTab === 'products' && (
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
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] hover:scale-102 active:scale-98 cursor-pointer"
            >
              + Add Confection
            </button>
          </div>
          
          {/* TanStack Table Search & Filter Controls for Products */}
          <div className="mb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <input 
              type="text"
              value={prodGlobalFilter}
              onChange={e => setProdGlobalFilter(e.target.value)}
              placeholder="🔍 Search confections by Name or Status Note..."
              className="bg-white border border-border rounded-xl px-4 py-2.5 text-xs text-[#333] placeholder:text-muted-foreground/60 w-full md:w-96 focus:outline-none focus:border-primary font-medium shadow-sm"
            />
            {prodGlobalFilter && (
              <button 
                onClick={() => setProdGlobalFilter('')}
                className="text-xs text-primary font-bold hover:underline self-end md:self-auto cursor-pointer"
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

          {/* TanStack Table Pagination Controls for Products */}
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
        </div>
      )}
 
      {activeTab === 'orders' && (
        <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[70vh] animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#333]">Fulfillment Control</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Manage, inspect, seal, and dispatch fresh Godavari confections.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div>
                Total Sales Volume: <span className="text-primary font-black">₹{orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total_amount : 0), 0)}</span>
              </div>
              <button 
                onClick={exportOrdersToCSV}
                className="bg-white hover:bg-neutral-50 border border-border text-muted-foreground hover:text-[#333] font-bold text-xs px-4 py-2 rounded-xl transition-all hover:scale-102 flex items-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
              >
                📤 Export Orders CSV
              </button>
            </div>
          </div>
          {/* TanStack Table Search & Filter Controls */}
          <div className="mb-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <input 
              type="text"
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              placeholder="🔍 Search orders by Customer, Email, Products, or ID..."
              className="bg-white border border-border rounded-xl px-4 py-2.5 text-xs text-[#333] placeholder:text-muted-foreground/60 w-full md:w-96 focus:outline-none focus:border-primary font-medium shadow-sm"
            />
            {globalFilter && (
              <button 
                onClick={() => setGlobalFilter('')}
                className="text-xs text-primary font-bold hover:underline self-end md:self-auto cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-border/50 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left">
              <thead>
                {orderTable.getHeaderGroups().map(headerGroup => (
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
                {orderTable.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-border/40 hover:bg-neutral-50/50 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-4 text-xs font-medium text-[#333]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {orderTable.getRowModel().rows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-muted-foreground text-sm font-medium">
                      No matching orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* TanStack Table Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-xs text-muted-foreground font-medium">
              Showing page <span className="text-primary font-black">{orderTable.getState().pagination.pageIndex + 1}</span> of <span className="font-black text-[#333]">{orderTable.getPageCount() || 1}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-bold">Rows per page:</span>
              <select 
                value={orderTable.getState().pagination.pageSize}
                onChange={e => orderTable.setPageSize(Number(e.target.value))}
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
                  onClick={() => orderTable.previousPage()}
                  disabled={!orderTable.getCanPreviousPage()}
                  className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-muted-foreground hover:text-[#333] hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => orderTable.nextPage()}
                  disabled={!orderTable.getCanNextPage()}
                  className="px-4 py-2 border border-border bg-white rounded-xl text-xs font-bold text-muted-foreground hover:text-[#333] hover:bg-neutral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
 
      {activeTab === 'announcements' && (
        <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col min-h-[70vh] animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#333]">Flash Update Alerts</h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-medium">Publish or edit flash headers visible to all store visitors.</p>
            </div>
            <button 
              onClick={() => {
                setEditingAnn(null);
                setNewAnn({ text: '', type: 'info', is_active: true });
                setIsAnnModalOpen(true);
              }}
              className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] hover:scale-102 active:scale-98 cursor-pointer"
            >
              + Create Flash Update
            </button>
          </div>
 
          <div className="overflow-y-auto pr-2 flex flex-col gap-4 flex-1">
            {announcements.map(ann => (
              <div 
                key={ann.id} 
                className={`flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl transition-all gap-4 ${
                  ann.is_active 
                    ? 'bg-[#fafafa] border-primary/30 shadow-sm' 
                    : 'bg-neutral-50/50 border-border/60 opacity-60'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                      ann.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      ann.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      ann.type === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-cyan-50 text-cyan-700 border border-cyan-200'
                    }`}>
                      {ann.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(ann.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-[#333]">{ann.text}</p>
                </div>
                
                <div className="flex items-center gap-4 self-end md:self-center">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={ann.is_active} 
                      onChange={() => handleAnnToggle(ann.id, ann.is_active)} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  
                  <button 
                    onClick={() => {
                      setEditingAnn(ann);
                      setNewAnn({ text: ann.text, type: ann.type, is_active: ann.is_active });
                      setIsAnnModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-white border border-border hover:bg-primary hover:text-white text-muted-foreground rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
                  >
                    Edit Update
                  </button>
                  <button 
                    onClick={() => handleAnnDelete(ann.id)} 
                    className="px-3.5 py-1.5 bg-white border border-border hover:bg-destructive hover:text-white text-destructive rounded-lg transition-all text-xs font-bold active:scale-98 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {announcements.length === 0 && (
              <p className="text-center py-8 text-muted-foreground text-sm font-medium">No announcements created yet.</p>
            )}
          </div>
        </div>
      )}
 
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          {/* Create Coupon Form */}
          <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm h-fit">
            <h2 className="text-2xl font-bold font-serif text-[#333] mb-6">Create Coupon</h2>
            {couponStatus && <div className="bg-primary/10 text-primary p-3 rounded-lg mb-4 text-sm font-medium border border-primary/20">{couponStatus}</div>}
            
            <form onSubmit={handleCouponSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Promo Code</label>
                <input 
                  type="text" 
                  placeholder="e.g. SWEET20" 
                  value={newCoupon.code} 
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })} 
                  required 
                  className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm uppercase font-mono font-bold text-[#333]"
                />
              </div>
 
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Discount Type</label>
                <select 
                  value={newCoupon.discount_type} 
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm text-[#333]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
 
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Discount Value</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 10 or 150" 
                  value={newCoupon.discount_value} 
                  onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: e.target.value })} 
                  required 
                  className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm font-mono text-[#333]"
                />
              </div>
 
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Minimum Order Value (₹)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 500" 
                  value={newCoupon.min_order_value} 
                  onChange={(e) => setNewCoupon({ ...newCoupon, min_order_value: e.target.value })} 
                  className="bg-[#fafafa] border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-sm font-mono text-[#333]"
                />
              </div>
              
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer mt-2 font-semibold">
                <input 
                  type="checkbox" 
                  checked={newCoupon.is_active} 
                  onChange={(e) => setNewCoupon({ ...newCoupon, is_active: e.target.checked })} 
                  className="accent-primary w-4 h-4" 
                />
                Make Active Immediately
              </label>
              
              <button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl transition-all mt-2 shadow-[0_4px_12px_rgba(186,36,42,0.15)] active:scale-98 cursor-pointer">
                Create Coupon
              </button>
            </form>
          </div>
 
          {/* Coupons List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col h-[80vh]">
            <h2 className="text-2xl font-bold font-serif text-[#333] mb-6">Active Coupons</h2>
            <div className="overflow-y-auto pr-2 flex flex-col gap-4 flex-1">
              {coupons.map(coupon => (
                <div 
                  key={coupon.code} 
                  className={`flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl transition-all gap-4 ${
                    coupon.is_active 
                      ? 'bg-[#fafafa] border-primary/30 shadow-sm' 
                      : 'bg-neutral-50/50 border-border/60 opacity-60'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[14px] uppercase font-mono font-black text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20 tracking-wider">
                        {coupon.code}
                      </span>
                      <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                        coupon.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black/5 text-muted-foreground'
                      }`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground font-semibold mt-2">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}% OFF` 
                        : `₹${coupon.discount_value} OFF`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Min Order Value: ₹{coupon.min_order_value || 0}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 self-end md:self-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={coupon.is_active} 
                        onChange={() => handleCouponToggle(coupon.code, coupon.is_active)} 
                      />
                      <div className="w-11 h-6 bg-black/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                    
                    <button 
                      onClick={() => handleCouponDelete(coupon.code)} 
                      className="p-2 bg-black/5 hover:bg-destructive hover:text-foreground rounded-lg transition-all text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {coupons.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">No coupons created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white p-8 rounded-3xl border border-border/50 shadow-sm max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold font-serif text-[#333] mb-6">Store & Payment Settings</h2>
          {settingsStatus && <div className="bg-primary/10 text-primary p-3 rounded-lg mb-6 text-sm font-semibold border border-primary/20">{settingsStatus}</div>}
          
          <form onSubmit={handleSettingsSubmit} className="flex flex-col gap-8">
            {/* Shipping Settings */}
            <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
              <h3 className="font-bold text-lg text-[#333]">Shipping Rules</h3>
              <p className="text-sm text-muted-foreground">Configure shipping fees and free delivery thresholds.</p>
              
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Flat Shipping Fee (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={settings.shipping_fee !== undefined ? settings.shipping_fee : 50.00} 
                    onChange={(e) => setSettings({ ...settings, shipping_fee: parseFloat(e.target.value) || 0 })}
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary w-full text-[#333] font-medium" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Free Shipping Threshold (₹)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={settings.free_shipping_threshold !== undefined ? settings.free_shipping_threshold : 999.00} 
                    onChange={(e) => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary w-full text-[#333] font-medium" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#fafafa] border border-border/60 rounded-xl">
              <div>
                <h3 className="font-bold text-lg text-[#333]">Cash on Delivery (COD)</h3>
                <p className="text-sm text-muted-foreground">Allow customers to pay when their order is delivered.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.cod_enabled} onChange={(e) => setSettings({ ...settings, cod_enabled: e.target.checked })} />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#333]">Partial Payment (Layaway)</h3>
                  <p className="text-sm text-muted-foreground">Allow customers to pay a percentage upfront and the rest later.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={settings.partial_payment_enabled} onChange={(e) => setSettings({ ...settings, partial_payment_enabled: e.target.checked })} />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {settings.partial_payment_enabled && (
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  <label className="text-sm text-muted-foreground font-bold uppercase tracking-wide">Upfront Percentage (%)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="99" 
                    value={settings.partial_payment_percent} 
                    onChange={(e) => setSettings({ ...settings, partial_payment_percent: parseInt(e.target.value) })}
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary w-full md:w-1/3 text-[#333] font-medium" 
                  />
                </div>
              )}
            </div>

            {/* Homepage Hero Customization */}
            <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
              <h3 className="font-bold text-lg text-primary">Homepage Hero Showcase</h3>
              <p className="text-sm text-muted-foreground">Customize the main hero cover picture or set up a looping multi-image carousel.</p>

              {/* Single Hero Image Upload */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Hero Background / Main Image</label>
                  <button 
                    type="button"
                    onClick={() => openAssetLibrary((url) => setSettings(prev => ({ ...prev, hero_image_url: url })))}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    📁 Browse Cloud Library
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  {settings.hero_image_url && (
                    <img 
                      src={settings.hero_image_url} 
                      alt="Hero Cover" 
                      className="w-16 h-16 rounded-xl object-cover border border-border"
                    />
                  )}
                  <label className="flex-1 flex items-center justify-center h-16 border border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-white transition-all">
                    <span className="text-xs text-muted-foreground font-medium hover:text-foreground">Upload New Hero Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setSettingsStatus('Uploading hero cover image...');
                        try {
                          const uploadData = await uploadImage(file);
                          if (!uploadData?.url) throw new Error('No URL returned from backend');
                          setSettings({ ...settings, hero_image_url: uploadData.url });
                          setSettingsStatus('Hero image uploaded successfully!');
                          setTimeout(() => setSettingsStatus(''), 3000);
                        } catch (err) {
                          console.error("Hero upload error:", err);
                          setSettingsStatus('Failed to upload hero image.');
                        }
                      }}
                    />
                  </label>
                </div>
                <input 
                  type="text" 
                  value={settings.hero_image_url || ''} 
                  onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                  placeholder="Or paste direct cover URL..." 
                  className="bg-white border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary w-full mt-1 text-[#333]"
                />
              </div>

              {/* Carousel Toggle Switch */}
              <div className="flex items-center justify-between p-3 bg-white border border-border rounded-xl mt-2">
                <div>
                  <h4 className="font-bold text-sm text-[#333]">Enable Multi-Image Carousel Mode</h4>
                  <p className="text-xs text-muted-foreground">If enabled, the hero section will loop through all carousel confections.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.hero_use_carousel || false} 
                    onChange={(e) => setSettings({ ...settings, hero_use_carousel: e.target.checked })} 
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Carousel Urls Management */}
              {settings.hero_use_carousel && (
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
                  <h4 className="font-bold text-md text-primary">Advanced Carousel Slide Manager</h4>
                  <p className="text-xs text-muted-foreground">Add slides with gorgeous custom titles, descriptions, and images. They will fade in sync!</p>

                  {/* Add Slide Builder form */}
                  <div className="p-4 bg-white border border-border/60 rounded-2xl flex flex-col gap-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Create New Slide</h5>
                    
                    <input 
                      type="text" 
                      placeholder="Slide Title / Confection Name" 
                      value={newHeroSlide.title} 
                      onChange={(e) => setNewHeroSlide({ ...newHeroSlide, title: e.target.value })}
                      className="bg-[#fafafa] border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary w-full text-[#333] font-medium"
                    />

                    <textarea 
                      rows="2" 
                      placeholder="Slide Description / Captivating Details" 
                      value={newHeroSlide.description} 
                      onChange={(e) => setNewHeroSlide({ ...newHeroSlide, description: e.target.value })}
                      className="bg-[#fafafa] border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary w-full text-[#333] font-medium"
                    />

                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] text-muted-foreground">Slide Photo URL</span>
                        <button 
                          type="button"
                          onClick={() => openAssetLibrary((url) => setNewHeroSlide(prev => ({ ...prev, image_url: url })))}
                          className="text-[9px] text-primary hover:underline font-bold"
                        >
                          📁 Choose from Storage
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        {newHeroSlide.image_url ? (
                          <div className="relative rounded-lg overflow-hidden w-10 h-10 border border-primary/20 flex-shrink-0">
                            <img src={newHeroSlide.image_url} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <label className="flex-1 flex items-center justify-center h-10 border border-dashed border-border hover:border-primary/50 rounded-xl cursor-pointer bg-[#fafafa] transition-all text-[11px] text-muted-foreground">
                            {slideUploading ? "Uploading..." : "📷 Upload Photo"}
                            <input 
                              type="file" 
                              accept="image/*" 
                              disabled={slideUploading}
                              className="hidden" 
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setSlideUploading(true);
                                try {
                                  const uploadData = await uploadImage(file);
                                  if (!uploadData?.url) throw new Error('No URL returned from backend');
                                  setNewHeroSlide(prev => ({ ...prev, image_url: uploadData.url }));
                                } catch (err) {
                                  console.error(err);
                                  alert("Failed to upload slide image");
                                } finally {
                                  setSlideUploading(false);
                                }
                              }}
                            />
                          </label>
                        )}
                        
                        <input 
                          type="text" 
                          placeholder="Or paste image url..." 
                          value={newHeroSlide.image_url} 
                          onChange={(e) => setNewHeroSlide({ ...newHeroSlide, image_url: e.target.value })}
                          className="bg-white border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary text-[10px] flex-1 text-[#333]"
                        />
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={() => {
                        if (!newHeroSlide.image_url || !newHeroSlide.title) {
                          alert("Please provide at least a title and a slide image!");
                          return;
                        }
                        const currentSlides = Array.isArray(settings.hero_slides) ? settings.hero_slides : [];
                        const updatedSlides = [...currentSlides, newHeroSlide];
                        setSettings({ ...settings, hero_slides: updatedSlides });
                        setNewHeroSlide({ title: '', description: '', image_url: '' });
                      }}
                      className="bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold py-2.5 rounded-xl text-xs transition-all mt-1 active:scale-98 cursor-pointer"
                    >
                      + Add Slide to Carousel
                    </button>
                  </div>

                  {/* Active list of Carousel Slides */}
                  <div className="flex flex-col gap-2 mt-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Slide Sequence</h5>
                    
                    {Array.isArray(settings.hero_slides) && settings.hero_slides.length > 0 ? (
                      <div className="flex flex-col gap-3">
                        {settings.hero_slides.map((slide, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl shadow-sm">
                            <img src={slide.image_url} className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs truncate text-[#333]">{slide.title}</h4>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">{slide.description}</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const updated = settings.hero_slides.filter((_, index) => index !== i);
                                setSettings({ ...settings, hero_slides: updated });
                              }}
                              className="text-xs text-destructive hover:underline font-bold px-2 py-1 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">No slide confections added yet. Add one above!</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Store Packing & Print Settings */}
            <div className="flex flex-col gap-4 p-4 bg-[#fafafa] border border-border/60 rounded-xl">
              <h3 className="font-bold text-lg text-primary">Store Packing & Invoice Customization</h3>
              <p className="text-sm text-muted-foreground">Configure the dynamic details printed on customer invoices and admin packaging slips.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Brand Store Name</label>
                  <input 
                    type="text" 
                    value={settings.store_name || ''} 
                    onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                    placeholder="E.g. Aha Konaseema"
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Carrier Logistics Name</label>
                  <input 
                    type="text" 
                    value={settings.courier_partner || ''} 
                    onChange={(e) => setSettings({ ...settings, courier_partner: e.target.value })}
                    placeholder="E.g. Ghee Express Courier"
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Fulfillment Kitchen Origin Address</label>
                <textarea 
                  value={settings.origin_address || ''} 
                  onChange={(e) => setSettings({ ...settings, origin_address: e.target.value })}
                  placeholder="E.g. Ravulapalem, East Godavari District, Andhra Pradesh"
                  rows="2"
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm leading-relaxed font-medium" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Support Email Address</label>
                  <input 
                    type="email" 
                    value={settings.support_email || ''} 
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                    placeholder="E.g. support@ahakonaseema.com"
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Support Contact Phone</label>
                  <input 
                    type="text" 
                    value={settings.support_phone || ''} 
                    onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                    placeholder="E.g. +91 888 777 6666"
                    className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Quality Seal / Invoice Terms Guarantee</label>
                <textarea 
                  value={settings.guarantee_text || ''} 
                  onChange={(e) => setSettings({ ...settings, guarantee_text: e.target.value })}
                  placeholder="Items separated by bullet '•' will be printed as checkboxes (e.g. Pure Ghee verified • Vacuum leakage protection sealed)"
                  rows="3"
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm leading-relaxed font-medium" 
                />
                <p className="text-[10px] text-muted-foreground italic">Use the dot symbol '•' (Alt + 0149 / option + 8) to separate bulleted quality seals printed on packing slips.</p>
              </div>
            </div>
            
            <button type="submit" className="bg-primary hover:bg-primary/95 text-white font-bold py-4 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] active:scale-98 cursor-pointer">
              Save Settings
            </button>
          </form>
        </div>
      )}

      {/* Cloud Asset Library Modal */}
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
                className="text-muted-foreground hover:text-[#333] text-lg font-bold p-2 cursor-pointer"
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
              {/* Upload inside Picker */}
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
                      if (!uploadData?.url) throw new Error('No URL returned from backend');
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

      {/* Fulfillment Docket & Printable Packing Slip Overlay */}
      {selectedFulfillmentOrder && (() => {
        const printStoreName = settings.store_name || 'Aha Konaseema';
        const printOriginAddress = settings.origin_address || 'Ravulapalem, East Godavari District, Andhra Pradesh';
        const printCourierPartner = settings.courier_partner || 'Ghee Express Courier';
        const printSupportEmail = settings.support_email || 'admin@rameshayyala.online';
        const printSupportPhone = settings.support_phone || '+91 888 777 6666';
        const printGuaranteeText = settings.guarantee_text || 'Pure Milk Ghee Freshness verified • Vacuum leakage protection sealed • Brand seal attached';
        const guaranteeItems = printGuaranteeText.split('•').map(s => s.trim()).filter(Boolean);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md transition-opacity">
            {/* Print container configuration style */}
            <style>{`
              @media print {
                /* Hide all headers, navbars, footers, and other dashboard menus */
                nav, footer, header, .no-print, .print-hidden {
                  display: none !important;
                }
                /* Eliminate modal backdrops and backgrounds */
                .fixed {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  background: white !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border: none !important;
                }
                .relative {
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                  max-width: 100% !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                /* Print slips full width pure black-on-white text */
                #packing-slip-print-area {
                  display: block !important;
                  background: white !important;
                  color: black !important;
                  width: 100% !important;
                  border: none !important;
                  padding: 20px !important;
                  margin: 0 !important;
                }
                #packing-slip-print-area * {
                  color: black !important;
                  border-color: #ddd !important;
                  background: transparent !important;
                }
              }
            `}</style>
            
            {/* Backdrop Closer */}
            <div className="absolute inset-0" onClick={() => setSelectedFulfillmentOrder(null)}></div>
            
            <div className="relative w-full max-w-2xl bg-white border border-border rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto z-10 shadow-2xl">
              {/* Action Bar (No Print) */}
              <div className="flex justify-between items-center no-print border-b border-border pb-4">
                <div>
                  <h3 className="text-xl font-bold font-serif text-[#333] tracking-tight">
                    Fulfillment Docket
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">{printStoreName} Logistics Manager</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => window.open('/print/packing-slip/' + selectedFulfillmentOrder.id, '_blank')}
                    className="bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all hover:scale-102 shadow-sm cursor-pointer"
                  >
                    🖨️ Packing Slip
                  </button>
                  <button 
                    onClick={() => window.open('/print/invoice/' + selectedFulfillmentOrder.id, '_blank')}
                    className="bg-[#fafafa] hover:bg-black/5 border border-border text-[#333] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    🧾 Customer Invoice
                  </button>
                  <button 
                    onClick={() => setSelectedFulfillmentOrder(null)}
                    className="bg-[#fafafa] hover:bg-black/5 border border-border text-[#333] font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Print Area */}
              <div id="packing-slip-print-area" className="flex flex-col gap-6 bg-[#fafafa] text-[#333] rounded-2xl p-6 border border-border print:bg-white print:text-black print:border-none">
                
                {/* Slip Header */}
                <div className="flex justify-between items-start border-b border-border print:border-black/20 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-primary font-serif tracking-tight">
                      {printStoreName.toUpperCase()}
                    </h2>
                    <p className="text-[10px] text-muted-foreground print:text-black/60 uppercase font-black tracking-widest mt-1">Sweets & Savories Fulfillment Slip</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#333] print:text-black">
                      ORDER ID: #{selectedFulfillmentOrder.id.toUpperCase()}
                    </span>
                    <p className="text-[10px] text-muted-foreground print:text-black/60 mt-1">
                      Date Placed: {new Date(selectedFulfillmentOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-border print:border-black/20 text-xs">
                  <div>
                    <h4 className="font-bold text-primary print:text-black uppercase tracking-wider mb-2 text-[10px]">Ship To Address</h4>
                    <div className="flex flex-col gap-1 text-muted-foreground print:text-black/80 font-medium">
                      <span className="font-bold text-[#333] print:text-black text-sm">
                        {selectedFulfillmentOrder.shipping_address?.firstName} {selectedFulfillmentOrder.shipping_address?.lastName}
                      </span>
                      <span>{selectedFulfillmentOrder.shipping_address?.address}</span>
                      <span>{selectedFulfillmentOrder.shipping_address?.city}, {selectedFulfillmentOrder.shipping_address?.postalCode}</span>
                      <span>{selectedFulfillmentOrder.shipping_address?.country || 'India'}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-primary print:text-black uppercase tracking-wider mb-2 text-[10px]">Logistics Info</h4>
                    <div className="flex flex-col gap-1 text-muted-foreground print:text-black/80 font-medium">
                      <span><strong>Carrier:</strong> {printCourierPartner}</span>
                      <span><strong>Origin:</strong> {printOriginAddress}</span>
                      <span><strong>Support Contact:</strong> {printSupportPhone} ({printSupportEmail})</span>
                      <span><strong>Status:</strong> {selectedFulfillmentOrder.status.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="flex flex-col gap-3">
                  <h4 className="font-bold text-primary print:text-black uppercase tracking-wider text-[10px]">Order Details</h4>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border print:border-black/20 text-muted-foreground print:text-black/60 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2">Confection Item</th>
                        <th className="py-2 text-center">Quantity</th>
                        <th className="py-2 text-right">Unit Price</th>
                        <th className="py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFulfillmentOrder.order_items?.map((item, idx) => (
                        <tr key={idx} className="border-b border-border/40 print:border-black/10 text-muted-foreground print:text-black/80">
                          <td className="py-2.5 font-bold text-[#333] print:text-black">{item.products?.name}</td>
                          <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                          <td className="py-2.5 text-right">₹{item.price_at_time}</td>
                          <td className="py-2.5 text-right font-bold text-[#333] print:text-black">₹{item.quantity * item.price_at_time}</td>
                        </tr>
                      ))}
                      <tr className="text-[#333] print:text-black font-bold">
                        <td colSpan="3" className="py-4 text-right uppercase font-black text-[10px]">Grand Payment Total</td>
                        <td className="py-4 text-right text-sm text-primary print:text-black font-black">₹{selectedFulfillmentOrder.total_amount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Quality Seal Checklist */}
                <div className="p-4 bg-white print:bg-black/5 rounded-xl border border-border print:border-black/10 flex flex-col gap-2 mt-2">
                  <span className="text-[10px] text-primary print:text-black font-black uppercase tracking-widest">
                    🛡️ {printStoreName.toUpperCase()} QUALITY GUARANTEE SEAL
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-muted-foreground print:text-black/80 font-medium">
                    {guaranteeItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="accent-primary" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── CATEGORIES TAB PANEL ── */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">

          {/* Create Category Form */}
          <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm h-fit">
            <h2 className="text-xl font-bold text-[#333] mb-5">Create Category</h2>
            {categoryStatus && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-semibold border ${categoryStatus.includes('Error') ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                {categoryStatus}
              </div>
            )}
            <form
              onSubmit={async (e) => {
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
              }}
              className="flex flex-col gap-4"
            >
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
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-98 cursor-pointer"
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
                    onClick={async () => {
                      if (!window.confirm(`Delete category "${cat.name}"? Products in this category will not be deleted.`)) return;
                      try {
                        await deleteCategory(cat.id);
                        loadData();
                      } catch (err) {
                        alert(`Error deleting: ${err.message}`);
                      }
                    }}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-all text-xs font-bold border border-transparent hover:border-destructive/20 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
              {/* Row 1: Name + SKU */}
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

              {/* Row 2: Price + Category */}
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
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Product Image</label>
                {formData.image_url ? (
                  <div className="relative group rounded-xl overflow-hidden aspect-square max-w-[130px]">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))} className="bg-destructive text-white px-3 py-1 rounded-full text-xs cursor-pointer">Remove</button>
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

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea name="description" placeholder="Describe the product..." value={formData.description} onChange={handleProductChange} rows="3" className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium resize-none" />
              </div>

              {/* Admin Alert Badge */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Admin Alert Badge</label>
                <input name="admin_note" placeholder="e.g. Fresh Kitchen Arrival Today" value={formData.admin_note} onChange={handleProductChange} className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-primary placeholder:text-primary/40 text-primary text-sm font-semibold" />
              </div>

              {/* Featured */}
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer font-medium">
                <input type="checkbox" name="featured" checked={formData.featured} onChange={handleProductChange} className="accent-primary w-4 h-4" />
                Feature on Homepage Carousel
              </label>

              {/* Variants */}
              <div className="flex flex-col gap-3 bg-[#fafafa] border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Variants (optional)</label>
                  <button
                    type="button"
                    onClick={() => setVariantsList(prev => [...prev, { sku: '', price: formData.price, weight: '', size: '' }])}
                    className="text-xs text-primary font-bold hover:underline cursor-pointer"
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
                      className="text-destructive text-xs font-bold hover:bg-destructive/10 px-2 py-1.5 rounded-lg cursor-pointer shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {variantsList.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No variants — product will use base price.</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 mt-1">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:scale-101 active:scale-98 cursor-pointer">
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

      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="absolute inset-0" onClick={() => setIsAnnModalOpen(false)}></div>
          
          <div className="relative w-full max-w-lg bg-white border border-border rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto z-10 shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-bold font-serif text-[#333]">
                {editingAnn ? 'Edit Flash Alert' : 'Create Flash Update Alert'}
              </h2>
              <button 
                onClick={() => setIsAnnModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#fafafa] border border-border rounded-full hover:bg-black/5 transition-colors text-[#333] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {annStatus && <div className="bg-primary/10 text-primary border border-primary/20 p-3 rounded-lg text-sm font-semibold">{annStatus}</div>}
            
            <form onSubmit={handleAnnouncementSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Alert Message Text</label>
                <textarea 
                  name="text" 
                  placeholder="Type flash update message (e.g. ⚡ FLASH SALE: 20% OFF Ravulapalem Ghee Sweets today only!)" 
                  value={newAnn.text} 
                  onChange={(e) => setNewAnn({ ...newAnn, text: e.target.value })} 
                  required 
                  rows="3" 
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm leading-relaxed font-medium"
                ></textarea>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-bold tracking-wider uppercase">Alert Styling Type</label>
                <select 
                  value={newAnn.type} 
                  onChange={(e) => setNewAnn({ ...newAnn, type: e.target.value })}
                  className="bg-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary text-[#333] text-sm font-medium"
                >
                  <option value="info">Info Alert (Cyan Glow)</option>
                  <option value="success">Success / Promo (Green Glow)</option>
                  <option value="warning">Warning / Alert (Amber Glow)</option>
                  <option value="critical">Critical / Emergency (Red Glow)</option>
                </select>
              </div>
              
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer py-1 font-medium">
                <input 
                  type="checkbox" 
                  checked={newAnn.is_active} 
                  onChange={(e) => setNewAnn({ ...newAnn, is_active: e.target.checked })} 
                  className="accent-primary w-4 h-4" 
                />
                Make Active Immediately on Header Announcement Bar
              </label>
              
              <div className="flex gap-2 mt-2">
                <button type="submit" className="flex-1 bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(186,36,42,0.15)] hover:scale-102 active:scale-98 cursor-pointer">
                  {editingAnn ? 'Apply Flash Update Changes' : 'Publish Flash Announcement'}
                </button>
                <button type="button" onClick={() => setIsAnnModalOpen(false)} className="px-5 bg-[#fafafa] border border-border rounded-xl hover:bg-black/5 transition-all text-xs font-bold text-[#333] cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;
