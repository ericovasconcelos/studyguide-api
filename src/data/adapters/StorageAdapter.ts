import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export interface StorageAdapter {
  // Study methods
  getStudies(): Promise<Study[]>;
  saveStudy(study: Study): Promise<void>;
  bulkSaveStudies(studies: Study[]): Promise<void>;
  clearStudies(): Promise<void>;

  // StudyCycle methods
  getStudyCycles(): Promise<StudyCycle[]>;
  saveStudyCycle(cycle: StudyCycle): Promise<void>;
  bulkSaveCycles(cycles: StudyCycle[]): Promise<void>;
  clearStudyCycles(): Promise<void>;

  // General methods
  clear(): Promise<void>;
  invalidateCache(): Promise<void>;
  getCacheStatus(): Promise<{ size: number; lastUpdated: Date }>;

  // Import methods
  findDuplicateStudies?(studies: Study[]): Promise<Study[]>;
  bulkUpsertStudies?(studies: Study[]): Promise<void>;
} 