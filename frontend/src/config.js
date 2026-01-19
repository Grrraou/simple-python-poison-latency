const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
export const PROXY_API_BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/users/me`,
  },
  COLLECTIONS: `${API_BASE_URL}/api/collections`,
  ENDPOINTS: `${API_BASE_URL}/api/endpoints`,
  API_KEYS: `${API_BASE_URL}/api/keys`,
  // Go API proxy endpoints
  SANDBOX: `${PROXY_API_BASE_URL}/sandbox`,
  PROXY: `${PROXY_API_BASE_URL}/proxy`,
}; 