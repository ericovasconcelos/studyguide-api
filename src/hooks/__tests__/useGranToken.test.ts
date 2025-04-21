import { renderHook, act } from '@testing-library/react-hooks';
import { useGranToken } from '../useGranToken';
import axios from 'axios';
import { getCurrentUserId } from '../../config/auth';

// Mock dependencies
jest.mock('axios');
jest.mock('../../config/auth');
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedGetCurrentUserId = getCurrentUserId as jest.MockedFunction<typeof getCurrentUserId>;

describe('useGranToken', () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();
    
    // Mock getCurrentUserId
    mockedGetCurrentUserId.mockReturnValue('test-user-id');
    
    // Mock axios.get
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          granToken: 'test-token',
          granTokenUpdatedAt: new Date().toISOString()
        }
      }
    });
    
    // Mock axios.post
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: 'Gran token saved successfully'
      }
    });
    
    // Mock axios.delete
    mockedAxios.delete.mockResolvedValue({
      data: {
        success: true,
        message: 'Gran token cleared successfully'
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should load token from API on initial render', async () => {
    // Arrange
    const { result, waitForNextUpdate } = renderHook(() => useGranToken());
    
    // Act
    await waitForNextUpdate();
    
    // Assert
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/gran-token/test-user-id');
    expect(result.current.token).toBe('test-token');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fall back to localStorage if API call fails', async () => {
    // Arrange
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
    (localStorage.getItem as jest.Mock).mockReturnValueOnce('local-token');
    
    const { result, waitForNextUpdate } = renderHook(() => useGranToken());
    
    // Act
    await waitForNextUpdate();
    
    // Assert
    expect(localStorage.getItem).toHaveBeenCalledWith('granToken');
    expect(result.current.token).toBe('local-token');
    expect(result.current.loading).toBe(false);
  });

  it('should save token to API and localStorage', async () => {
    // Arrange
    const { result, waitForNextUpdate } = renderHook(() => useGranToken());
    await waitForNextUpdate();
    
    // Act
    await act(async () => {
      const success = await result.current.saveToken('new-token');
      
      // Assert
      expect(success).toBe(true);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/gran-token/test-user-id',
        { granToken: 'new-token' }
      );
      expect(localStorage.setItem).toHaveBeenCalledWith('granToken', 'new-token');
      expect(result.current.token).toBe('new-token');
    });
  });

  it('should clear token from API and localStorage', async () => {
    // Arrange
    const { result, waitForNextUpdate } = renderHook(() => useGranToken());
    await waitForNextUpdate();
    
    // Act
    await act(async () => {
      const success = await result.current.clearToken();
      
      // Assert
      expect(success).toBe(true);
      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/gran-token/test-user-id');
      expect(localStorage.removeItem).toHaveBeenCalledWith('granToken');
      expect(result.current.token).toBeNull();
    });
  });

  it('should handle errors when saving token', async () => {
    // Arrange
    mockedAxios.post.mockRejectedValueOnce(new Error('Save error'));
    const { result, waitForNextUpdate } = renderHook(() => useGranToken());
    await waitForNextUpdate();
    
    // Act
    await act(async () => {
      const success = await result.current.saveToken('error-token');
      
      // Assert
      expect(success).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
  });
}); 