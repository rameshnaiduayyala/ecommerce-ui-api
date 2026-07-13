const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

const getHeaders = (isMultipart = false) => {
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('jwt_access_token');
  console.log('[apiClient] getHeaders - Token:', token ? `${token.substring(0, 15)}... (len: ${token.length})` : 'null');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || 'An error occurred';
    return Promise.reject({ status: response.status, message: errorMsg, data });
  }

  return data;
};

const request = async (url, options = {}) => {
  const fullUrl = `${BASE_URL}${url}`;
  try {
    const response = await fetch(fullUrl, options);
    return await handleResponse(response);
  } catch (error) {
    if (error.status === 401) {
      const refreshToken = localStorage.getItem('jwt_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('jwt_access_token');
        localStorage.removeItem('jwt_refresh_token');
        localStorage.removeItem('sweetverse_user');
        window.dispatchEvent(new Event('auth_session_expired'));
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        const tokenUsedToRefresh = refreshToken;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshData = await handleResponse(refreshRes);
          if (refreshData?.success && refreshData?.data) {
            const { accessToken, refreshToken: newRefreshToken } = refreshData.data;
            localStorage.setItem('jwt_access_token', accessToken);
            localStorage.setItem('jwt_refresh_token', newRefreshToken);
            isRefreshing = false;
            onRefreshed(accessToken);
          } else {
            throw new Error('Refresh failed');
          }
        } catch (refreshErr) {
          isRefreshing = false;
          if (localStorage.getItem('jwt_refresh_token') === tokenUsedToRefresh) {
            localStorage.removeItem('jwt_access_token');
            localStorage.removeItem('jwt_refresh_token');
            localStorage.removeItem('sweetverse_user');
            window.dispatchEvent(new Event('auth_session_expired'));
          }
          return Promise.reject(error);
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${token}`
            }
          };
          resolve(fetch(fullUrl, newOptions).then(handleResponse));
        });
      });
    }
    return Promise.reject(error);
  }
};

export const apiClient = {
  get: (url) => request(url, {
    method: 'GET',
    headers: getHeaders()
  }),
  
  post: (url, body, isMultipart = false) => request(url, {
    method: 'POST',
    headers: getHeaders(isMultipart),
    body: isMultipart ? body : JSON.stringify(body)
  }),

  put: (url, body) => request(url, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body)
  }),

  patch: (url, body) => request(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body)
  }),

  delete: (url) => request(url, {
    method: 'DELETE',
    headers: getHeaders()
  })
};
