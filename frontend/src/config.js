const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
export const PROXY_API_BASE_URL = process.env.REACT_APP_PROXY_API_BASE_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    ME: `${API_BASE_URL}/api/users/me`,
  },
  CONFIG_KEYS: `${API_BASE_URL}/api/config-keys`,
  SANDBOX: `${PROXY_API_BASE_URL}/sandbox`,
};
