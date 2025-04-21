import { Request, Response, NextFunction } from 'express';
import { Result } from '../domain/result';
import { logger } from '../utils/logger';

export class ValidationMiddleware {
  private readonly context = 'ValidationMiddleware';

  validateStudy = (req: Request, res: Response, next: NextFunction) => {
    try {
      const { subject, topic, date, duration } = req.body;

      // Sanitize input
      const sanitizedData = {
        subject: this.sanitizeString(subject),
        topic: this.sanitizeString(topic),
        date: this.sanitizeDate(date),
        duration: this.sanitizeNumber(duration)
      };

      // Validate required fields
      if (!sanitizedData.subject) {
        return res.status(400).json({ error: 'Subject is required' });
      }
      if (!sanitizedData.topic) {
        return res.status(400).json({ error: 'Topic is required' });
      }
      if (!sanitizedData.date) {
        return res.status(400).json({ error: 'Date is required' });
      }
      if (!sanitizedData.duration) {
        return res.status(400).json({ error: 'Duration is required' });
      }

      // Validate duration range
      if (sanitizedData.duration < 0 || sanitizedData.duration > 1440) {
        return res.status(400).json({ error: 'Duration must be between 0 and 1440 minutes' });
      }

      // Validate date is not in the future
      if (sanitizedData.date > new Date()) {
        return res.status(400).json({ error: 'Date cannot be in the future' });
      }

      req.body = sanitizedData;
      next();
    } catch (error) {
      logger.error(this.context, 'Validation error', { error });
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  private sanitizeString(value: any): string {
    if (typeof value !== 'string') {
      return '';
    }
    return value.trim();
  }

  private sanitizeDate(value: any): Date | null {
    if (!value) {
      return null;
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private sanitizeNumber(value: any): number {
    if (typeof value === 'number') {
      return value;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }
} 