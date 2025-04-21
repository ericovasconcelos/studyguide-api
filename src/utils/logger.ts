export const logger = {
  error: (context: string, message: string, error?: any) => {
    console.error(`[${context}] ${message}`, error);
  },
  warn: (context: string, message: string, error?: any) => {
    console.warn(`[${context}] ${message}`, error);
  },
  info: (context: string, message: string, data?: any) => {
    console.info(`[${context}] ${message}`, data);
  },
  debug: (context: string, message: string, data?: any) => {
    console.debug(`[${context}] ${message}`, data);
  }
}; 