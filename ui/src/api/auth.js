import { apiClient } from './apiClient';

export const signUp = async (email, password, metadata = {}) => {
  const [firstName = '', ...lastNameParts] = (metadata.full_name || '').trim().split(' ');
  const lastName = lastNameParts.join(' ');
  const res = await apiClient.post('/auth/register', {
    email,
    password,
    firstName: firstName || 'User',
    lastName: lastName || 'User',
    phone: metadata.phone || undefined
  });
  return res?.data;
};

export const signIn = async (email, password) => {
  const res = await apiClient.post('/auth/login', { email, password });
  if (res?.success && res?.data) {
    const { tokens, user } = res.data;
    const accessToken = tokens?.accessToken;
    const refreshToken = tokens?.refreshToken;
    localStorage.setItem('jwt_access_token', accessToken);
    localStorage.setItem('jwt_refresh_token', refreshToken);
    localStorage.setItem('sweetverse_user', JSON.stringify(user));
    return { session: { access_token: accessToken }, user };
  }
  throw new Error(res?.message || 'Login failed');
};

export const signOut = async () => {
  const refreshToken = localStorage.getItem('jwt_refresh_token');
  if (refreshToken) {
    try {
      await apiClient.post('/auth/logout', { refreshToken });
    } catch (e) {
      console.warn('Logout request failed (non-blocking):', e);
    }
  }
  localStorage.removeItem('jwt_access_token');
  localStorage.removeItem('jwt_refresh_token');
  localStorage.removeItem('sweetverse_user');
};

export const getCurrentUser = async () => {
  const userJson = localStorage.getItem('sweetverse_user');
  if (userJson) {
    return JSON.parse(userJson);
  }
  return null;
};

// Address Management API integrations
export const getAddresses = async () => {
  const res = await apiClient.get('/auth/addresses');
  return res?.data || [];
};

export const createAddress = async (address) => {
  const res = await apiClient.post('/auth/addresses', address);
  return res?.data;
};

export const updateAddress = async (id, address) => {
  const res = await apiClient.put(`/auth/addresses/${id}`, address);
  return res?.data;
};

export const deleteAddress = async (id) => {
  const res = await apiClient.delete(`/auth/addresses/${id}`);
  return res?.data;
};

export const changePassword = async (password) => {
  const res = await apiClient.put('/auth/password', { password });
  return res?.data;
};
