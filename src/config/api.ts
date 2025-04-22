/**
 * API Configuration
 * This file contains all the API related configuration
 */

// API Base URL - Sempre usar a variável de ambiente configurada (sem o prefixo /api/)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Endpoints com prefixo /api/ explícito para padronização
export const ENDPOINTS = {
  USERS: '/api/users',
  AUTH: '/api/auth',
  GRAN_TOKEN: '/api/gran-token',
};

/**
 * Get the full URL for an API endpoint
 * @param endpoint The endpoint path (deve incluir o prefixo /api/)
 * @returns The full URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
}; 