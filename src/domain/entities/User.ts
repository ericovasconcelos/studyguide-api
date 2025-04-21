import { Result } from '../result';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin';

export class User {
  private constructor(
    private readonly id: string,
    private email: string,
    private password: string,
    private name: string,
    private role: UserRole,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {}

  static create(
    id: string,
    email: string,
    password: string,
    name: string,
    role: UserRole = 'user'
  ): Result<User> {
    if (!email || !email.includes('@')) {
      return Result.fail('Invalid email');
    }

    if (!password || password.length < 6) {
      return Result.fail('Password must be at least 6 characters');
    }

    if (!name) {
      return Result.fail('Name is required');
    }

    const now = new Date();
    return Result.ok(
      new User(
        id,
        email.toLowerCase(),
        password,
        name,
        role,
        now,
        now
      )
    );
  }

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getName(): string {
    return this.name;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getRole(): UserRole {
    return this.role;
  }

  async setPassword(password: string): Promise<Result<void>> {
    if (!password || password.length < 6) {
      return Result.fail('Password must be at least 6 characters');
    }
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(password, salt);
      this.updatedAt = new Date();
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail('Failed to hash password');
    }
  }

  async validatePassword(password: string): Promise<Result<boolean>> {
    try {
      const isValid = await bcrypt.compare(password, this.password);
      return Result.ok(isValid);
    } catch (error) {
      return Result.fail('Failed to validate password');
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 