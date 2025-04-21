import { User } from '../entities/User';
import { Result } from '../result';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  updateGranToken(userId: string, granToken: string): Promise<Result<void>>;
  clearGranToken(userId: string): Promise<Result<void>>;
} 