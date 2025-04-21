export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    studies: string;
    studyCycles: string;
    sync: string;
    uploadChanges: string;
    downloadChanges: string;
    gran: string;
  };
}

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiConfig: ApiConfig = {
  baseUrl,
  endpoints: {
    studies: `${baseUrl}/studies`,
    studyCycles: `${baseUrl}/study-cycles`,
    sync: `${baseUrl}/sync`,
    uploadChanges: `${baseUrl}/upload-changes`,
    downloadChanges: `${baseUrl}/download-changes`,
    gran: `${baseUrl}/gran`
  }
};

/**
 * Obtém a URL para uma API específica com base nas configurações do ambiente
 */
export const getApiUrl = (endpoint: keyof ApiConfig['endpoints']): string => {
  // Usar window.location.origin em produção, assim como o config original
  const baseUrl = process.env.NODE_ENV === 'production'
    ? window.location.origin
    : process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  const endpoints: ApiConfig['endpoints'] = {
    studies: `${baseUrl}/studies`,
    studyCycles: `${baseUrl}/study-cycles`,
    sync: `${baseUrl}/sync`,
    uploadChanges: `${baseUrl}/upload-changes`,
    downloadChanges: `${baseUrl}/download-changes`,
    gran: `${baseUrl}/gran`
  };
  
  console.log(`[DEBUG] API URL (${endpoint}): ${endpoints[endpoint]} [env: ${process.env.NODE_ENV}]`);
  return endpoints[endpoint];
}; 