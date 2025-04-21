import { User } from '../domain/entities/User';
import { Result } from '../domain/result';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private readonly context = 'AuthService';
  private readonly jwtSecret: string;
  private readonly tokenExpiration: string;

  constructor(jwtSecret: string, tokenExpiration: string) {
    this.jwtSecret = jwtSecret;
    this.tokenExpiration = tokenExpiration;
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.getId(),
      email: user.getEmail(),
      role: user.getRole()
    };

    return jwt.sign(
      payload,
      this.jwtSecret,
      {
        expiresIn: this.tokenExpiration
      } as jwt.SignOptions
    );
  }

  async validateToken(token: string): Promise<Result<JwtPayload>> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return Result.ok(payload);
    } catch (error) {
      logger.error(this.context, 'Invalid token', { error });
      return Result.fail('Invalid token');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async authorize(user: User, resource: string, action: string): Promise<boolean> {
    // Implement role-based access control
    if (user.getRole() === 'admin') {
      return true;
    }

    // Add more specific authorization rules here
    return false;
  }
} 