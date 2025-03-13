export const config = {
  api: {
    baseUrl: process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : process.env.REACT_APP_API_URL || 'http://localhost:5000',
    endpoints: {
      fetchGranData: '/fetch-gran-data'
    }
  }
};

interface ApiEndpoints {
  fetchGranData: string;
  base: string;  // Adicionando endpoint base
}

/**
 * Obtém a URL para uma API específica com base nas configurações do ambiente
 */
export const getApiUrl = (endpoint: keyof ApiEndpoints): string => {
  // Usar window.location.origin em produção, assim como o config original
  const baseUrl = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const endpoints: ApiEndpoints = {
    fetchGranData: `${baseUrl}/fetch-gran-data`,
    base: baseUrl  // URL base da API
  };
  
  console.log(`[DEBUG] API URL (${endpoint}): ${endpoints[endpoint]} [env: ${process.env.NODE_ENV}]`);
  return endpoints[endpoint];
}; 