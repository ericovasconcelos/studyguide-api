import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';
import { EventEmitter } from '../events/EventEmitter';

export interface StorageAdapter {
  // Core methods
  getEventEmitter?(): EventEmitter;
  
  // Study methods
  getStudies(): Promise<Study[]>;
  saveStudy(study: Study): Promise<void>;
  saveStudies(studies: Study[]): Promise<void>;
  findDuplicateStudies?(studies: Study[]): Promise<Study[]>;
  
  // StudyCycle methods
  getStudyCycles(): Promise<StudyCycle[]>;
  saveStudyCycle(cycle: StudyCycle): Promise<void>;
  saveStudyCycles(cycles: StudyCycle[]): Promise<void>;
  
  // Cache methods
  clear(): Promise<void>;
  clearStudies(): Promise<void>;
  clearStudyCycles(): Promise<void>;
  
  // Optional methods for specific adapters
  getCacheStatus?(): Promise<{ size: number; lastUpdated: Date }>;
  bulkUpsertStudies?(studies: Study[]): Promise<void>;
  invalidateCache?(): Promise<void>;
} 