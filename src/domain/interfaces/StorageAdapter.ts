import { Result } from '../../domain/result';
import { Study } from '../entities/Study';
import { StudyCycle } from '../entities/StudyCycle';

export interface StorageAdapter {
    getStudies(): Promise<Result<Study[]>>;
    saveStudy(study: Study): Promise<Result<void>>;
    clearStudies(): Promise<void>;
  
    getStudyCycles(): Promise<Result<StudyCycle[]>>;
    saveStudyCycle(cycle: StudyCycle): Promise<Result<void>>;
    saveStudyCycles(cycles: StudyCycle[]): Promise<Result<void>>;
    clearStudyCycles(): Promise<Result<void>>;
    invalidateCache(): Promise<Result<void>>;
  }
  
