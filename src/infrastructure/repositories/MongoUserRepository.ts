import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserModel } from '../models/UserModel';
import { Result } from '../../domain/result';
import { logger } from '../../utils/logger';

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(id);
      if (!user) {
        return null;
      }
      return user.toDomain();
    } catch (error) {
      logger.error('Error finding user by id', error);
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return null;
      }
      return user.toDomain();
    } catch (error) {
      logger.error('Error finding user by email', error);
      return null;
    }
  }

  async save(user: User): Promise<User> {
    try {
      const userData = user.toEntity();
      // Remove ID for new user creation to let MongoDB generate it
      if (!userData.id || userData.id === '') {
        delete userData.id;
      }
      
      const newUser = await UserModel.create(userData);
      return newUser.toDomain();
    } catch (error) {
      logger.error('Error saving user', error);
      throw new Error('Failed to save user');
    }
  }

  async update(user: User): Promise<User> {
    try {
      const userData = user.toEntity();
      const updatedUser = await UserModel.findByIdAndUpdate(
        userData.id,
        {
          email: userData.email,
          name: userData.name,
          passwordHash: userData.passwordHash,
          granToken: userData.granToken,
          granTokenUpdatedAt: userData.granTokenUpdatedAt,
          settings: userData.settings,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser.toDomain();
    } catch (error) {
      logger.error('Error updating user', error);
      throw new Error('Failed to update user');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await UserModel.findByIdAndDelete(id);
    } catch (error) {
      logger.error('Error deleting user', error);
      throw new Error('Failed to delete user');
    }
  }

  async updateGranToken(userId: string, granToken: string): Promise<Result<void>> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return Result.fail('User not found');
      }

      user.granToken = granToken;
      user.granTokenUpdatedAt = new Date();
      user.updatedAt = new Date();
      await user.save();

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error updating Gran token', error);
      return Result.fail('Failed to update Gran token');
    }
  }

  async clearGranToken(userId: string): Promise<Result<void>> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return Result.fail('User not found');
      }

      user.granToken = undefined;
      user.granTokenUpdatedAt = undefined;
      user.updatedAt = new Date();
      await user.save();

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error clearing Gran token', error);
      return Result.fail('Failed to clear Gran token');
    }
  }
} 