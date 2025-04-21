import { Result } from '../result';

export class Duration {
  private constructor(private readonly minutes: number) {}
  
  static create(minutes: number): Result<Duration> {
    if (minutes < 0) return Result.fail('Duration cannot be negative');
    if (minutes > 1440) return Result.fail('Duration cannot exceed 24 hours');
    return Result.ok(new Duration(minutes));
  }
  
  getMinutes(): number { return this.minutes; }
  
  add(minutes: number): Result<Duration> {
    return Duration.create(this.minutes + minutes);
  }
  
  subtract(minutes: number): Result<Duration> {
    return Duration.create(this.minutes - minutes);
  }
  
  equals(other: Duration): boolean {
    return this.minutes === other.minutes;
  }
  
  toString(): string {
    const hours = Math.floor(this.minutes / 60);
    const remainingMinutes = this.minutes % 60;
    return `${hours}h${remainingMinutes}m`;
  }
} 