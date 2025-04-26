import axios from 'axios';

// Base URLs for the blockchain APIs
export const REST_API_URL = 'http://145.223.80.193:1317';
export const RPC_API_URL = 'http://145.223.80.193:26657';

/**
 * Creates an axios instance with CORS proxy configuration
 */
export const createAxiosInstance = () => {
  const instance = axios.create();
  
  // Request interceptor to add CORS proxy
  instance.interceptors.request.use((config) => {
    const originalUrl = config.url || '';
    
    // Only proxy URLs that match our API endpoints
    if (originalUrl.includes('145.223.80.193')) {
      config.url = `https://api.allorigins.win/raw?url=${originalUrl}`;
    }
    
    return config;
  });

  return instance;
};

// Create a default axios instance with CORS proxy
export const axiosWithCors = createAxiosInstance(); 