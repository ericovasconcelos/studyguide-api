import { Result } from '../../domain/result';
import { Study } from '../entities/Study';
import { StudyCycle } from '../../data/models/StudyCycle';

export interface StorageAdapter {
    getStudies(): Promise<Result<Study[]>>;
    saveStudy(study: Study): Promise<Result<void>>;
    updateStudy(study: Study): Promise<Result<void>>;
    deleteStudy(id: string): Promise<Result<void>>;
    clearStudies(): Promise<Result<void>>;
  
    getStudyCycles(): Promise<Result<StudyCycle[]>>;
    saveStudyCycle(cycle: StudyCycle): Promise<Result<void>>;
    saveStudyCycles(cycles: StudyCycle[]): Promise<Result<void>>;
    clearStudyCycles(): Promise<Result<void>>;
    invalidateCache(): Promise<Result<void>>;
}
  
