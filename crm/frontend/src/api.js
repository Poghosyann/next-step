import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatically retry GET requests on transient serverless/network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (
      config &&
      config.method === 'get' &&
      (config.__retryCount || 0) < 2 &&
      (!error.response || error.response.status >= 500)
    ) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 250 * config.__retryCount));
      return api(config);
    }
    return Promise.reject(error);
  }
);

export default api;
