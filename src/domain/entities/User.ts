import { Result } from '../result';
import bcrypt from 'bcryptjs';

export type UserRole = 'user' | 'admin';

export interface UserProps {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role?: string;
  granToken?: string;
  granTokenUpdatedAt?: Date;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly id: string;
  private email: string;
  private name: string;
  private passwordHash: string;
  private role: string;
  private granToken?: string;
  private granTokenUpdatedAt?: Date;
  private settings: Record<string, any>;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.role = props.role || 'user';
    this.granToken = props.granToken;
    this.granTokenUpdatedAt = props.granTokenUpdatedAt;
    this.settings = props.settings || {};
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: UserProps): Result<User> {
    if (!props.id) {
      return Result.fail('Id is required');
    }

    if (!props.email) {
      return Result.fail('Email is required');
    }

    if (!props.name) {
      return Result.fail('Name is required');
    }

    if (!props.passwordHash) {
      return Result.fail('Password hash is required');
    }

    if (!props.createdAt) {
      props.createdAt = new Date();
    }

    if (!props.updatedAt) {
      props.updatedAt = new Date();
    }

    return Result.ok(new User(props));
  }

  public getId(): string {
    return this.id;
  }

  public getEmail(): string {
    return this.email;
  }

  public getName(): string {
    return this.name;
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public getGranToken(): string | undefined {
    return this.granToken;
  }

  public getGranTokenUpdatedAt(): Date | undefined {
    return this.granTokenUpdatedAt;
  }

  public getSettings(): Record<string, any> {
    return { ...this.settings };
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public getRole(): string {
    return this.role;
  }

  public setEmail(email: string): Result<void> {
    if (!email) {
      return Result.fail('Email is required');
    }
    this.email = email;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setName(name: string): Result<void> {
    if (!name) {
      return Result.fail('Name is required');
    }
    this.name = name;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setPasswordHash(passwordHash: string): Result<void> {
    if (!passwordHash) {
      return Result.fail('Password hash is required');
    }
    this.passwordHash = passwordHash;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setGranToken(token: string): Result<void> {
    this.granToken = token;
    this.granTokenUpdatedAt = new Date();
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public clearGranToken(): Result<void> {
    this.granToken = undefined;
    this.granTokenUpdatedAt = undefined;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public updateSetting(key: string, value: any): Result<void> {
    this.settings[key] = value;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setRole(role: string): Result<void> {
    this.role = role;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public toEntity(): any {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      passwordHash: this.passwordHash,
      role: this.role,
      granToken: this.granToken,
      granTokenUpdatedAt: this.granTokenUpdatedAt,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  async setPassword(password: string): Promise<Result<void>> {
    if (!password || password.length < 6) {
      return Result.fail('Password must be at least 6 characters');
    }
    
    try {
      const salt = await bcrypt.genSalt(10);
      this.passwordHash = await bcrypt.hash(password, salt);
      this.updatedAt = new Date();
      return Result.ok(undefined);
    } catch (error) {
      return Result.fail('Failed to hash password');
    }
  }

  async validatePassword(password: string): Promise<Result<boolean>> {
    try {
      const isValid = await bcrypt.compare(password, this.passwordHash);
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
      passwordHash: this.passwordHash,
      role: this.role,
      granToken: this.granToken,
      granTokenUpdatedAt: this.granTokenUpdatedAt,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
} 