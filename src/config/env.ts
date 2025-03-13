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

// Helper para construir URLs completas
export const getApiUrl = (endpoint: keyof typeof config.api.endpoints): string => {
  return `${config.api.baseUrl}${config.api.endpoints[endpoint]}`;
}; 