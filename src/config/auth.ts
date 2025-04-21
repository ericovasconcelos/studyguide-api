import { logger } from '../utils/logger';

/**
 * Gets the current user ID from local storage or generates a temporary one
 */
export function getCurrentUserId(): string {
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    return storedUserId;
  }

  // Generate a temporary user ID if none exists
  const tempUserId = `temp-${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('userId', tempUserId);
  logger.info('Generated temporary user ID:', tempUserId);
  return tempUserId;
}

/**
 * Sets a permanent user ID (e.g. after cloud sync setup)
 */
export function setPermanentUserId(userId: string): void {
  localStorage.setItem('userId', userId);
  logger.info('Set permanent user ID:', userId);
}

/**
 * Clears the stored user ID (e.g. on logout)
 */
export function clearUserId(): void {
  localStorage.removeItem('userId');
  logger.info('Cleared user ID');
} 