import { apiClient } from './apiClient';

export const getCart = async (cartId = null) => {
  const url = `/cart${cartId ? `?cartId=${cartId}` : ''}`;
  const res = await apiClient.get(url);
  return res?.data;
};

export const addToCart = async (variantId, quantity = 1, cartId = null) => {
  const res = await apiClient.post('/cart/add', { variantId, quantity, cartId });
  return res?.data;
};

export const updateCartItem = async (itemId, quantity) => {
  const res = await apiClient.put(`/cart/items/${itemId}`, { quantity });
  return res?.data;
};

export const removeCartItem = async (itemId) => {
  const res = await apiClient.delete(`/cart/items/${itemId}`);
  return res?.data;
};

export const mergeCart = async (guestCartId) => {
  const res = await apiClient.post('/cart/merge', { guestCartId });
  return res?.data;
};

export const getWishlist = async () => {
  const res = await apiClient.get('/cart/wishlist');
  return res?.data || [];
};

export const addToWishlist = async (variantId) => {
  const res = await apiClient.post('/cart/wishlist', { variantId });
  return res?.data;
};

export const removeFromWishlist = async (variantId) => {
  const res = await apiClient.delete(`/cart/wishlist/${variantId}`);
  return res?.data;
};
