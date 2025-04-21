import { Request, Response, NextFunction } from 'express';
import { Result } from '../domain/result';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

// Extend Express Request type
declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      email: string;
      role: string;
    };
  }
}

export class AuthMiddleware {
  private readonly context = 'AuthMiddleware';
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  async handle(req: AuthRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const parts = authHeader.split(' ');
      if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token error' });
      }

      const [scheme, token] = parts;
      if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformatted' });
      }

      const verifyTokenPromise = new Promise<JwtPayload>((resolve, reject) => {
        jwt.verify(token, this.secret, (err: jwt.VerifyErrors | null, decoded: unknown) => {
          if (err) reject(err);
          else resolve(decoded as JwtPayload);
        });
      });

      const result = await Result.fromPromise(verifyTokenPromise);
      if (result.failed()) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const payload = result.getValue();
      req.user = payload;
      return next();
    } catch (error) {
      logger.error(this.context, 'Authentication error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  authorize = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = req.user;
        if (!user) {
          return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!roles.includes(user.role)) {
          return res.status(403).json({ error: 'Forbidden' });
        }

        next();
      } catch (error) {
        logger.error(this.context, 'Authorization error', { error });
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
} 