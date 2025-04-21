import { Result } from '../result';

export class DateRange {
  private constructor(
    private readonly startDate: Date,
    private readonly endDate: Date
  ) {}

  static create(startDate: Date, endDate: Date): Result<DateRange> {
    if (!startDate || !endDate) {
      return Result.fail('Start date and end date are required');
    }

    if (startDate > endDate) {
      return Result.fail('Start date cannot be after end date');
    }

    return Result.ok(new DateRange(startDate, endDate));
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date {
    return this.endDate;
  }

  includes(date: Date): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && other.startDate <= this.endDate;
  }

  getDays(): number {
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
} 