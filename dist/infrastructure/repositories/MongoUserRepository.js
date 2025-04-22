"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoUserRepository = void 0;
const UserModel_1 = require("../models/UserModel");
const result_1 = require("../../domain/result");
const logger_1 = require("../../utils/logger");
class MongoUserRepository {
    async findById(id) {
        try {
            const user = await UserModel_1.UserModel.findById(id);
            if (!user) {
                return null;
            }
            return user.toDomain();
        }
        catch (error) {
            logger_1.logger.error('Error finding user by id', error);
            return null;
        }
    }
    async findByEmail(email) {
        try {
            const user = await UserModel_1.UserModel.findOne({ email });
            if (!user) {
                return null;
            }
            return user.toDomain();
        }
        catch (error) {
            logger_1.logger.error('Error finding user by email', error);
            return null;
        }
    }
    async save(user) {
        try {
            const userData = user.toEntity();
            // Remove ID for new user creation to let MongoDB generate it
            if (!userData.id || userData.id === '') {
                delete userData.id;
            }
            const newUser = await UserModel_1.UserModel.create(userData);
            return newUser.toDomain();
        }
        catch (error) {
            logger_1.logger.error('Error saving user', error);
            throw new Error('Failed to save user');
        }
    }
    async update(user) {
        try {
            const userData = user.toEntity();
            const updatedUser = await UserModel_1.UserModel.findByIdAndUpdate(userData.id, {
                email: userData.email,
                name: userData.name,
                passwordHash: userData.passwordHash,
                granToken: userData.granToken,
                granTokenUpdatedAt: userData.granTokenUpdatedAt,
                settings: userData.settings,
                updatedAt: new Date()
            }, { new: true });
            if (!updatedUser) {
                throw new Error('User not found');
            }
            return updatedUser.toDomain();
        }
        catch (error) {
            logger_1.logger.error('Error updating user', error);
            throw new Error('Failed to update user');
        }
    }
    async delete(id) {
        try {
            await UserModel_1.UserModel.findByIdAndDelete(id);
        }
        catch (error) {
            logger_1.logger.error('Error deleting user', error);
            throw new Error('Failed to delete user');
        }
    }
    async updateGranToken(userId, granToken) {
        try {
            const user = await UserModel_1.UserModel.findById(userId);
            if (!user) {
                return result_1.Result.fail('User not found');
            }
            user.granToken = granToken;
            user.granTokenUpdatedAt = new Date();
            user.updatedAt = new Date();
            await user.save();
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error updating Gran token', error);
            return result_1.Result.fail('Failed to update Gran token');
        }
    }
    async clearGranToken(userId) {
        try {
            const user = await UserModel_1.UserModel.findById(userId);
            if (!user) {
                return result_1.Result.fail('User not found');
            }
            user.granToken = undefined;
            user.granTokenUpdatedAt = undefined;
            user.updatedAt = new Date();
            await user.save();
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            logger_1.logger.error('Error clearing Gran token', error);
            return result_1.Result.fail('Failed to clear Gran token');
        }
    }
}
exports.MongoUserRepository = MongoUserRepository;
//# sourceMappingURL=MongoUserRepository.js.map