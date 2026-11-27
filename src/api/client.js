import axios from 'axios';

let inMemoryToken = null;

export function setApiToken(token) {
  inMemoryToken = token;
}

export function getApiToken() {
  return inMemoryToken;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.request.use((config) => {
  if (inMemoryToken) {
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  if (axios.isAxiosError(error)) {
    const serverMsg = error.response?.data?.error;
    if (typeof serverMsg === 'string' && serverMsg.trim()) {
      return serverMsg;
    }
    if (error.message === 'Network Error') {
      return 'Network connection error. Please check your connection and try again.';
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}
