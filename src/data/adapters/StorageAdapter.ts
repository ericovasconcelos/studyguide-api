import { Study } from '../../domain/entities/Study';
import { Result } from '../../domain/result';

export interface StorageAdapter {
  // Core study operations
  getStudies(): Promise<Result<Study[]>>;
  saveStudy(study: Study): Promise<Result<void>>;
  updateStudy(study: Study): Promise<Result<void>>;
  deleteStudy(id: string): Promise<Result<void>>;
  
  // Sync operations
  sync(): Promise<Result<void>>;
  invalidateCache(): Promise<Result<void>>;
  
  // Cleanup operations
  clearStudies(): Promise<void>;
} 