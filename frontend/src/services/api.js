import { API_ENDPOINTS } from '../config';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.detail || 'Request failed');
    error.response = { data };
    throw error;
  }
  return data;
};

export const login = async (username, password) => {
  const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(response);
  localStorage.setItem('token', data.access_token);
  return data;
};

export const register = async (username, email, password) => {
  const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(response);
};

export const getCurrentUser = async () => {
  const response = await fetch(API_ENDPOINTS.AUTH.ME, { headers: getAuthHeader() });
  return handleResponse(response);
};

export const logout = () => {
  localStorage.removeItem('token');
};

// Config keys
export const fetchConfigKeys = async () => {
  const response = await fetch(API_ENDPOINTS.CONFIG_KEYS, { headers: getAuthHeader() });
  return handleResponse(response);
};

export const createConfigKey = async (data) => {
  const response = await fetch(API_ENDPOINTS.CONFIG_KEYS, {
    method: 'POST',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateConfigKey = async (keyId, data) => {
  const response = await fetch(`${API_ENDPOINTS.CONFIG_KEYS}/${keyId}/`, {
    method: 'PUT',
    headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteConfigKey = async (keyId) => {
  const response = await fetch(`${API_ENDPOINTS.CONFIG_KEYS}/${keyId}/`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  return handleResponse(response);
};
