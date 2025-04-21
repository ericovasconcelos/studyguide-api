import { Study } from '../entities/Study';

export interface IStudyRepository {
  save(study: Study): Promise<Study>;
  findById(id: string): Promise<Study | null>;
  findByUserId(userId: string): Promise<Study[]>;
  findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Study[]>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Study[]>;
  saveMany(studies: Study[]): Promise<Study[]>;
  deleteByUserId(userId: string): Promise<void>;
  clear(): Promise<void>;
} 