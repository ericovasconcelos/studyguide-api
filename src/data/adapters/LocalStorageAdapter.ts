import { Result } from '../../domain/result';
import { Study } from '../../domain/entities/Study';
import { StorageAdapter } from './StorageAdapter';
import { logger } from '../../utils/logger';
import { StudyCycle } from '../models/StudyCycle';
import { StudyService } from '../services/StudyService';

export class LocalStorageAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'studyguide';
  private readonly STORE_NAME = 'studies';

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.DB_NAME, 1);

    request.onerror = () => {
      logger.error('Failed to open IndexedDB');
    };

    request.onsuccess = () => {
      this.db = request.result;
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
      }
    };
  }

  async getStudies(): Promise<Result<Study[]>> {
    if (!this.db) {
      return Result.fail('Database not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const studies = request.result.map((data: any) => Study.fromEntity(data));
        resolve(Result.ok(studies));
      };

      request.onerror = () => {
        logger.error('Failed to get studies from IndexedDB');
        resolve(Result.fail('Failed to get studies'));
      };
    });
  }

  async saveStudy(study: Study): Promise<Result<void>> {
    if (!this.db) {
      return Result.fail('Database not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(study.toEntity());

      request.onsuccess = () => {
        resolve(Result.ok(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to save study to IndexedDB');
        resolve(Result.fail('Failed to save study'));
      };
    });
  }

  async updateStudy(study: Study): Promise<Result<void>> {
    return this.saveStudy(study);
  }

  async deleteStudy(id: string): Promise<Result<void>> {
    if (!this.db) {
      return Result.fail('Database not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(Result.ok(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to delete study from IndexedDB');
        resolve(Result.fail('Failed to delete study'));
      };
    });
  }

  async sync(): Promise<Result<void>> {
    // Local storage doesn't need sync
    return Result.ok(undefined);
  }

  invalidateCache(): void {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async findDuplicateStudies(studies: Study[]): Promise<Study[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async bulkUpsertStudies(studies: Study[]): Promise<void> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  private mergeArrays<T extends { id?: string | number }>(existing: T[], incoming: T[]): T[] {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async getStudyCycles(): Promise<StudyCycle[]> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<void> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async clearStudyCycles(): Promise<void> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async saveStudies(studies: Study[]): Promise<void> {
    // Implementation needed
    throw new Error('Method not implemented');
  }
} 