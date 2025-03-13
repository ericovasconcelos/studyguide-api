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
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const endpoints: ApiEndpoints = {
    fetchGranData: `${baseUrl}/fetch-gran-data`,
    base: baseUrl  // URL base da API
  };
  
  return endpoints[endpoint];
}; 