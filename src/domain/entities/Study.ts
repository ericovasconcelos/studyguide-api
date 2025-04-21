import { Duration } from '../value-objects/Duration';
import { Result } from '../result';

export interface StudyProps {
  id: string;
  userId: string;
  date: Date;
  subject: string;
  topic: string;
  duration: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Study {
  private readonly id: string;
  private readonly userId: string;
  private date: Date;
  private subject: string;
  private topic: string;
  private duration: Duration;
  private notes: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  private constructor(props: StudyProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.date = props.date;
    this.subject = props.subject;
    this.topic = props.topic;
    this.duration = Duration.create(props.duration).getValue();
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: StudyProps): Result<Study> {
    if (!props.id) {
      return Result.fail('Id is required');
    }

    if (!props.userId) {
      return Result.fail('UserId is required');
    }

    if (!props.date) {
      return Result.fail('Date is required');
    }

    if (!props.subject) {
      return Result.fail('Subject is required');
    }

    if (!props.topic) {
      return Result.fail('Topic is required');
    }

    const durationResult = Duration.create(props.duration);
    if (durationResult.failed()) {
      return Result.fail(durationResult.getError());
    }

    return Result.ok(new Study(props));
  }

  public static fromEntity(data: any): Result<Study> {
    return Study.create({
      id: data.id,
      userId: data.userId,
      date: new Date(data.date),
      subject: data.subject,
      topic: data.topic,
      duration: data.duration,
      notes: data.notes,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  public toEntity(): StudyProps {
    return {
      id: this.id,
      userId: this.userId,
      date: this.date,
      subject: this.subject,
      topic: this.topic,
      duration: this.duration.getMinutes(),
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  public getId(): string {
    return this.id;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getDate(): Date {
    return this.date;
  }

  public getSubject(): string {
    return this.subject;
  }

  public getTopic(): string {
    return this.topic;
  }

  public getDuration(): number {
    return this.duration.getMinutes();
  }

  public getNotes(): string {
    return this.notes;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public setDate(date: Date): Result<void> {
    if (!date) {
      return Result.fail('Date is required');
    }
    this.date = date;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setSubject(subject: string): Result<void> {
    if (!subject) {
      return Result.fail('Subject is required');
    }
    this.subject = subject;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setTopic(topic: string): Result<void> {
    if (!topic) {
      return Result.fail('Topic is required');
    }
    this.topic = topic;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setDuration(minutes: number): Result<void> {
    if (minutes === undefined || minutes === null) {
      return Result.fail('Duration is required');
    }
    const durationResult = Duration.create(minutes);
    if (durationResult.failed()) {
      return Result.fail(durationResult.getError());
    }
    this.duration = durationResult.getValue();
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }

  public setNotes(notes: string): Result<void> {
    this.notes = notes;
    this.updatedAt = new Date();
    return Result.ok(undefined);
  }
} 