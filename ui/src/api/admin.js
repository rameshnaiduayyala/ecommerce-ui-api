import { apiClient } from './apiClient';

// Product APIs
export const getAdminProducts = async () => {
  // Catalog query to fetch all products
  const res = await apiClient.get('/catalog/products?take=1000&status=PUBLISHED');
  return res?.data || [];
};

export const updateProduct = async (id, updates) => {
  const res = await apiClient.put(`/catalog/products/${id}`, updates);
  return res?.data;
};

export const deleteProduct = async (id) => {
  await apiClient.delete(`/catalog/products/${id}`);
};

export const addProduct = async (productData) => {
  const res = await apiClient.post('/catalog/products', productData);
  return res?.data;
};

export const addCategory = async (categoryData) => {
  const payload = {
    ...categoryData,
    slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  };
  const res = await apiClient.post('/catalog/categories', payload);
  return res?.data;
};

export const updateCategory = async (id, data) => {
  const res = await apiClient.put(`/catalog/categories/${id}`, data);
  return res?.data;
};

export const deleteCategory = async (id) => {
  await apiClient.delete(`/catalog/categories/${id}`);
};

// Order APIs
export const getAllOrders = async () => {
  const res = await apiClient.get('/orders/admin/list?limit=1000');
  return res?.data || [];
};

export const updateOrderStatus = async (id, status, notes) => {
  const res = await apiClient.patch(`/orders/${id}/status`, { status, notes });
  return res?.data;
};

export const deleteOrder = async (id) => {
  await apiClient.delete(`/orders/${id}`);
};

export const toggleCoupon = async (id, active) => {
  const res = await apiClient.put(`/coupons/${id}/toggle`, { active });
  return res?.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/media/upload', formData, true);
  return res?.data;
};

// Settings APIs
export const getStoreSettings = async () => {
  const res = await apiClient.get('/cms/settings');
  return res?.data;
};

export const updateStoreSettings = async (updates) => {
  const res = await apiClient.put('/cms/settings', updates);
  return res?.data;
};

// Announcement APIs (Stored inside Setting key 'store_announcements')
export const getAnnouncements = async () => {
  const settings = await getStoreSettings();
  return settings?.store_announcements || [];
};

export const addAnnouncement = async (announcement) => {
  const list = await getAnnouncements();
  const newAnn = { 
    id: crypto.randomUUID(), 
    created_at: new Date().toISOString(), 
    ...announcement 
  };
  const updatedList = [newAnn, ...list];
  await updateStoreSettings({ store_announcements: updatedList });
  return [newAnn];
};

export const updateAnnouncement = async (id, updates) => {
  const list = await getAnnouncements();
  const updatedList = list.map(item => item.id === id ? { ...item, ...updates } : item);
  await updateStoreSettings({ store_announcements: updatedList });
  return updatedList.filter(item => item.id === id);
};

export const deleteAnnouncement = async (id) => {
  const list = await getAnnouncements();
  const updatedList = list.filter(item => item.id !== id);
  await updateStoreSettings({ store_announcements: updatedList });
};

// Coupons APIs
export const getCoupons = async () => {
  const res = await apiClient.get('/coupons');
  // Translate coupons list for UI consumption
  const coupons = res?.data || [];
  return coupons.map(coupon => ({
    id: coupon.id,
    code: coupon.code,
    discount_type: coupon.type === 'PERCENTAGE' ? 'percentage' : 'flat',
    discount_value: Number(coupon.value),
    min_order_value: Number(coupon.minOrderAmount),
    is_active: coupon.status === 'ACTIVE'
  }));
};

export const addCoupon = async (couponData) => {
  // Map UI coupon fields back to backend naming
  const payload = {
    code: couponData.code.toUpperCase(),
    type: couponData.discount_type === 'percentage' ? 'PERCENTAGE' : 'FLAT',
    value: Number(couponData.discount_value),
    minOrderAmount: Number(couponData.min_order_value || 0),
    startsAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Default 30 days
  };

  const res = await apiClient.post('/coupons', payload);
  return res?.data;
};

export const deleteCoupon = async (code) => {
  await apiClient.delete(`/coupons/${code}`);
};

export const validateCoupon = async (code, subtotal = 1000) => {
  try {
    const res = await apiClient.post('/coupons/validate', { code: code.toUpperCase(), subtotal });
    if (res?.data) {
      const coupon = res.data;
      return {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.type === 'PERCENTAGE' ? 'percentage' : 'flat',
        discount_value: Number(coupon.value),
        min_order_value: Number(coupon.minOrderAmount),
        is_active: coupon.status === 'ACTIVE'
      };
    }
  } catch (err) {
    console.warn("Coupon validation error:", err);
  }
  return null;
};
