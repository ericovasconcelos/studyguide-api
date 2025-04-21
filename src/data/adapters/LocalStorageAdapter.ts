import { Result } from '../../domain/result';
import { Study } from '../../domain/entities/Study';
import { StorageAdapter } from '../../domain/interfaces/StorageAdapter';
import { logger } from '../../utils/logger';
import { StudyCycle } from '../models/StudyCycle';

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
        const results: Result<Study>[] = request.result.map((data: any) => Study.fromEntity(data));

        const successfulStudies: Study[] = results
          .filter(result => result.succeeded())
          .map(result => result.getValue());

        const failedResults = results.filter(result => result.failed());
        if (failedResults.length > 0) {
          logger.warn(`Failed to convert ${failedResults.length} item(s) from IndexedDB data to Study entity.`);
          failedResults.forEach(failure => {
            try {
              logger.error('Entity conversion error:', failure.getError());
            } catch (e) {
              logger.error('Error getting error message from failed Result', e);
            }
          });
        }

        resolve(Result.ok(successfulStudies));
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

  async invalidateCache(): Promise<Result<void>> {
    logger.info('invalidateCache called on LocalStorageAdapter (no-op).');
    return Result.ok(undefined);
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

  async getStudyCycles(): Promise<Result<StudyCycle[]>> {
    // Implementation needed - returning success with empty array for now
    logger.warn('LocalStorageAdapter.getStudyCycles is not implemented, returning empty array.');
    return Result.ok([]); // Wrap result in Result.ok()
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<Result<void>> {
    // Implementation needed
    logger.warn('LocalStorageAdapter.saveStudyCycle is not implemented.');
    // throw new Error('Method not implemented');
    return Result.ok(undefined); // Return placeholder success result
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<Result<void>> {
    // Implementation needed
    logger.warn('LocalStorageAdapter.saveStudyCycles is not implemented.');
    // throw new Error('Method not implemented');
    return Result.ok(undefined);
  }

  async clearStudyCycles(): Promise<Result<void>> {
    // Implementation needed
    logger.warn('LocalStorageAdapter.clearStudyCycles is not implemented.');
    // throw new Error('Method not implemented');
    return Result.ok(undefined);
  }

  async saveStudies(studies: Study[]): Promise<void> {
    // Implementation needed
    throw new Error('Method not implemented');
  }

  async clearStudies(): Promise<Result<void>> {
    if (!this.db) {
      logger.error('Database not initialized before clearing studies');
      return Result.fail('Database not initialized');
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          logger.info('Studies cleared from IndexedDB');
          resolve(Result.ok(undefined));
        };

        request.onerror = () => {
          logger.error('Failed to clear studies from IndexedDB', request.error);
          resolve(Result.fail('Failed to clear studies'));
        };

        transaction.oncomplete = () => {
          // Optional: Can resolve here as well if preferred
        };

        transaction.onerror = () => {
          logger.error('Transaction error while clearing studies', transaction.error);
          resolve(Result.fail('Transaction error while clearing studies'));
        }
      } catch (error) {
        logger.error('Error initiating clearStudies transaction', error);
        resolve(Result.fail('Error initiating clearStudies transaction'));
      }
    });
  }
} 