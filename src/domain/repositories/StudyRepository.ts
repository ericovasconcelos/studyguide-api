import { Study } from '../entities/Study';

export interface StudyRepository {
  save(study: Study): Promise<void>;
  findById(id: string): Promise<Study | null>;
  findByUserId(userId: string): Promise<Study[]>;
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Study[]>;
  delete(id: string): Promise<void>;
} 