import mongoose from 'mongoose';
import { User } from '../../../domain/entities/User';
import { UserModel } from '../UserModel';

// Helper to convert a UserModel to a User domain entity
const userModelToDomain = (userDocument: any): User => {
  return new User({
    id: userDocument._id.toString(),
    email: userDocument.email,
    name: userDocument.name,
    role: userDocument.role || 'user',
    granToken: userDocument.granToken,
    granTokenUpdatedAt: userDocument.granTokenUpdatedAt
  });
};

describe('UserModel', () => {
  beforeAll(async () => {
    // Connect to a test database
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Disconnect from the database
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    await UserModel.deleteMany({});
  });

  it('should create a user with correct properties', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedPassword123',
      role: 'user'
    };

    // Act
    const createdUser = await UserModel.create(userData);

    // Assert
    expect(createdUser).toBeDefined();
    expect(createdUser.email).toBe(userData.email);
    expect(createdUser.name).toBe(userData.name);
    expect(createdUser.passwordHash).toBe(userData.passwordHash);
    expect(createdUser.role).toBe(userData.role);
    expect(createdUser.granToken).toBeUndefined();
    expect(createdUser.granTokenUpdatedAt).toBeUndefined();
  });

  it('should create a user with Gran token information', async () => {
    // Arrange
    const now = new Date();
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedPassword123',
      role: 'user',
      granToken: 'testGranToken123',
      granTokenUpdatedAt: now
    };

    // Act
    const createdUser = await UserModel.create(userData);

    // Assert
    expect(createdUser).toBeDefined();
    expect(createdUser.granToken).toBe(userData.granToken);
    expect(createdUser.granTokenUpdatedAt).toEqual(userData.granTokenUpdatedAt);
  });

  it('should correctly convert to domain User entity', async () => {
    // Arrange
    const now = new Date();
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedPassword123',
      role: 'admin',
      granToken: 'testGranToken123',
      granTokenUpdatedAt: now
    };
    const createdUser = await UserModel.create(userData);

    // Act
    const domainUser = userModelToDomain(createdUser);

    // Assert
    expect(domainUser).toBeInstanceOf(User);
    expect(domainUser.getId()).toBe(createdUser._id.toString());
    expect(domainUser.getEmail()).toBe(createdUser.email);
    expect(domainUser.getName()).toBe(createdUser.name);
    expect(domainUser.getRole()).toBe(createdUser.role);
    expect(domainUser.getGranToken()).toBe(createdUser.granToken);
    expect(domainUser.getGranTokenUpdatedAt()).toEqual(createdUser.granTokenUpdatedAt);
  });

  it('should update Gran token fields', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedPassword123',
      role: 'user'
    };
    const createdUser = await UserModel.create(userData);
    
    const granToken = 'newGranToken456';
    const now = new Date();

    // Act
    createdUser.granToken = granToken;
    createdUser.granTokenUpdatedAt = now;
    await createdUser.save();

    // Find the user again to verify changes were saved
    const updatedUser = await UserModel.findById(createdUser._id);

    // Assert
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.granToken).toBe(granToken);
    expect(updatedUser?.granTokenUpdatedAt?.getTime()).toBe(now.getTime());
  });

  it('should clear Gran token fields', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'hashedPassword123',
      role: 'user',
      granToken: 'testGranToken123',
      granTokenUpdatedAt: new Date()
    };
    const createdUser = await UserModel.create(userData);

    // Act
    createdUser.granToken = undefined;
    createdUser.granTokenUpdatedAt = undefined;
    await createdUser.save();

    // Find the user again to verify changes were saved
    const updatedUser = await UserModel.findById(createdUser._id);

    // Assert
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.granToken).toBeUndefined();
    expect(updatedUser?.granTokenUpdatedAt).toBeUndefined();
  });
}); 