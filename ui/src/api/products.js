import { getProducts, getProductByIdOrSlug, normalizeProduct } from './catalog';

export { getProducts, normalizeProduct };

export const getProductBySlug = async (slug) => {
  return getProductByIdOrSlug(slug);
};

export const getFeaturedProducts = async () => {
  return getProducts({ take: 8, status: 'PUBLISHED' });
};
