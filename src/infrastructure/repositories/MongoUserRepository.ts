import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserModel } from '../models/UserModel';
import { Result } from '../../domain/result';
import { logger } from '../../utils/logger';

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ _id: id });
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
      if (!userData.id || userData.id === '') {
        userData.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      userData._id = userData.id;
      
      const newUser = await UserModel.create(userData);
      return newUser.toDomain();
    } catch (error: any) {
      logger.error('Error saving user', error);
      
      // Verificar se é um erro de chave duplicada (MongoDB error code 11000)
      if (error.code === 11000) {
        // Verificar qual campo está duplicado
        if (error.keyPattern && error.keyPattern.email) {
          throw new Error('Email already registered');
        } else if (error.keyPattern && error.keyPattern._id) {
          throw new Error('User with this ID already exists');
        }
      }
      
      throw new Error('Failed to save user');
    }
  }

  async update(user: User): Promise<User> {
    try {
      const userData = user.toEntity();
      const updatedUser = await UserModel.findOneAndUpdate(
        { _id: userData.id },
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
      await UserModel.findOneAndDelete({ _id: id });
    } catch (error) {
      logger.error('Error deleting user', error);
      throw new Error('Failed to delete user');
    }
  }

  async updateGranToken(userId: string, granToken: string): Promise<Result<void>> {
    try {
      const user = await UserModel.findOne({ _id: userId });
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
      const user = await UserModel.findOne({ _id: userId });
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