import { GranTokenController } from '../GranTokenController';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { Result } from '../../domain/result';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }
}));

describe('GranTokenController', () => {
  let controller: GranTokenController;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockRequest: any;
  let mockResponse: any;
  let mockUser: User;

  beforeEach(() => {
    // Create mock user repository
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateGranToken: jest.fn(),
      clearGranToken: jest.fn()
    } as unknown as jest.Mocked<IUserRepository>;

    // Create controller with mocked repository
    controller = new GranTokenController(mockUserRepository);

    // Create mock request and response
    mockRequest = {
      params: { userId: 'test-user-id' },
      body: { granToken: 'test-token' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Create mock user
    mockUser = {
      getId: jest.fn().mockReturnValue('test-user-id'),
      getEmail: jest.fn().mockReturnValue('test@example.com'),
      getName: jest.fn().mockReturnValue('Test User'),
      getGranToken: jest.fn().mockReturnValue('existing-token'),
      getGranTokenUpdatedAt: jest.fn().mockReturnValue(new Date())
    } as unknown as User;
  });

  describe('saveToken', () => {
    it('should save token and return success response', async () => {
      // Arrange
      mockUserRepository.updateGranToken.mockResolvedValue(Result.ok(undefined));

      // Act
      await controller.saveToken(mockRequest, mockResponse);

      // Assert
      expect(mockUserRepository.updateGranToken).toHaveBeenCalledWith('test-user-id', 'test-token');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Gran token saved successfully'
      }));
    });

    it('should return error when userId is missing', async () => {
      // Arrange
      mockRequest.params.userId = undefined;

      // Act
      await controller.saveToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User ID is required'
      }));
    });

    it('should return error when granToken is missing', async () => {
      // Arrange
      mockRequest.body.granToken = undefined;

      // Act
      await controller.saveToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Gran token is required'
      }));
    });

    it('should return error when updateGranToken fails', async () => {
      // Arrange
      mockUserRepository.updateGranToken.mockResolvedValue(Result.fail('User not found'));

      // Act
      await controller.saveToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found'
      }));
    });
  });

  describe('getToken', () => {
    it('should return token when user exists', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      await controller.getToken(mockRequest, mockResponse);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: {
          granToken: 'existing-token',
          granTokenUpdatedAt: expect.any(Date)
        }
      }));
    });

    it('should return error when userId is missing', async () => {
      // Arrange
      mockRequest.params.userId = undefined;

      // Act
      await controller.getToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User ID is required'
      }));
    });

    it('should return error when user is not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      await controller.getToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found'
      }));
    });
  });

  describe('clearToken', () => {
    it('should clear token and return success response', async () => {
      // Arrange
      mockUserRepository.clearGranToken.mockResolvedValue(Result.ok(undefined));

      // Act
      await controller.clearToken(mockRequest, mockResponse);

      // Assert
      expect(mockUserRepository.clearGranToken).toHaveBeenCalledWith('test-user-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Gran token cleared successfully'
      }));
    });

    it('should return error when userId is missing', async () => {
      // Arrange
      mockRequest.params.userId = undefined;

      // Act
      await controller.clearToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User ID is required'
      }));
    });

    it('should return error when clearGranToken fails', async () => {
      // Arrange
      mockUserRepository.clearGranToken.mockResolvedValue(Result.fail('User not found'));

      // Act
      await controller.clearToken(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found'
      }));
    });
  });
}); 