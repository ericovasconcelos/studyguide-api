export const config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
    endpoints: {
      fetchGranData: '/fetch-gran-data'
    }
  }
};

// Helper para construir URLs completas
export const getApiUrl = (endpoint: keyof typeof config.api.endpoints): string => {
  return `${config.api.baseUrl}${config.api.endpoints[endpoint]}`;
}; 