import { apiClient } from './apiClient';

export const calculateCheckout = async (cartId, couponCode = null, shippingAddressId) => {
  const res = await apiClient.post('/orders/checkout/calculate', {
    cartId,
    couponCode: couponCode || undefined,
    shippingAddressId
  });
  return res?.data;
};

export const placeOrder = async ({ cartId, couponCode = null, shippingAddressId, billingAddressId = null, paymentMethod, currency = null }) => {
  const res = await apiClient.post('/orders/checkout/place', {
    cartId,
    couponCode: couponCode || undefined,
    shippingAddressId,
    billingAddressId: billingAddressId || undefined,
    paymentMethod,
    currency: currency || undefined
  });
  return res?.data;
};

export const getMyOrders = async (page = 1, limit = 20) => {
  const res = await apiClient.get(`/orders/my-orders?page=${page}&limit=${limit}`);
  return res?.data || [];
};

export const getOrderDetails = async (id) => {
  const res = await apiClient.get(`/orders/${id}`);
  return res?.data;
};
