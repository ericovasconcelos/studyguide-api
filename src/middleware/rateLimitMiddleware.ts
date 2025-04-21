import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

export class RateLimitMiddleware {
  private readonly context = 'RateLimitMiddleware';

  createLimiter(options: {
    windowMs: number;
    max: number;
    message?: string;
  }) {
    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: options.message || 'Too many requests, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        logger.warn(this.context, 'Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });
        res.status(429).json({ error: options.message || 'Too many requests, please try again later.' });
      }
    });
  }

  // Default limiters for different routes
  apiLimiter = this.createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many API requests, please try again later.'
  });

  authLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 login attempts per hour
    message: 'Too many login attempts, please try again later.'
  });

  importLimiter = this.createLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 imports per hour
    message: 'Too many import attempts, please try again later.'
  });
} 