import { apiClient } from './apiClient';

/**
 * Normalizes a raw product from the API into a consistent shape
 * for use across all UI components.
 */
export const normalizeProduct = (p) => ({
  ...p,
  price: Number(p.basePrice ?? p.price ?? 0),
  image_url: p.images?.[0]?.url || null,
  category: p.categories?.[0]?.category?.name || '',
  categoryId: p.categories?.[0]?.categoryId || p.categories?.[0]?.category?.id || '',
  rating: p.reviews?.length
    ? p.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / p.reviews.length
    : null,
  reviewCount: p.reviews?.length || 0,
});

export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.append(key, filters[key]);
    }
  });

  const queryString = params.toString();
  const url = `/catalog/products${queryString ? `?${queryString}` : ''}`;
  const res = await apiClient.get(url);
  const raw = res?.data || [];
  return Array.isArray(raw) ? raw.map(normalizeProduct) : [];
};

export const getProductByIdOrSlug = async (idOrSlug) => {
  const res = await apiClient.get(`/catalog/products/${idOrSlug}`);
  return res?.data ? normalizeProduct(res.data) : null;
};

export const searchProducts = async (query, extra = {}) => {
  return getProducts({ search: query, ...extra });
};

export const getProductsByCategory = async (categoryId, extra = {}) => {
  return getProducts({ categoryId, ...extra });
};

export const getCategories = async () => {
  const res = await apiClient.get('/catalog/categories');
  return res?.data || [];
};

export const getBrands = async () => {
  const res = await apiClient.get('/catalog/brands');
  return res?.data || [];
};
