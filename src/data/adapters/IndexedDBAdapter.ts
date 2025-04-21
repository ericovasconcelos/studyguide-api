import { StorageAdapter } from '../../domain/interfaces/StorageAdapter';
import { Study } from '../../domain/entities/Study';
import { StudyCycle } from '../models/StudyCycle';
import { logger } from '../../utils/logger';
import { Result } from '../../domain/result';

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'StudyGuideDB';
  private readonly version = 1;

  constructor() {
    this.initDB();
  }

  

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.version);

    request.onerror = () => {
      logger.error('Failed to open IndexedDB');
    };

    request.onsuccess = () => {
      this.db = request.result;
    };
 

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('studies')) {
        db.createObjectStore('studies', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('studyCycles')) {
        db.createObjectStore('studyCycles', { keyPath: 'id' });
      }
    };
  }

  async clearStudies(): Promise<void> {
    return void 0;
  }

  async getStudies(): Promise<Result<Study[]>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<Study[]>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studies'], 'readonly');
      const store = transaction.objectStore('studies');
      const request = store.getAll();

      request.onsuccess = () => {
        const studies = request.result.map((data: any) => {
          const studyResult = Study.fromEntity(data);
          if (studyResult.isFailure()) {
            logger.error('Failed to convert study from entity', studyResult.getError());
            return null;
          }
          return studyResult.getValue();
        }).filter((study): study is Study => study !== null);
        resolve(Result.ok<Study[]>(studies));
      };

      request.onerror = () => {
        logger.error('Failed to get studies from IndexedDB');
        resolve(Result.fail<Study[]>('Failed to get studies from IndexedDB'));
      };
    });
  }

  async saveStudy(study: Study): Promise<Result<void>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<void>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');
      const request = store.put(study.toEntity());

      request.onsuccess = () => {
        resolve(Result.ok<void>(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to save study to IndexedDB');
        resolve(Result.fail<void>('Failed to save study to IndexedDB'));
      };
    });
  }

  async updateStudy(study: Study): Promise<Result<void>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<void>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');
      const request = store.put(study.toEntity());

      request.onsuccess = () => {
        resolve(Result.ok<void>(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to update study in IndexedDB');
        resolve(Result.fail<void>('Failed to update study in IndexedDB'));
      };
    });
  }

  async deleteStudy(id: string): Promise<Result<void>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<void>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(Result.ok<void>(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to delete study from IndexedDB');
        resolve(Result.fail<void>('Failed to delete study from IndexedDB'));
      };
    });
  }

 

  async getStudyCycles(): Promise<Result<StudyCycle[]>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<StudyCycle[]>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studyCycles'], 'readonly');
      const store = transaction.objectStore('studyCycles');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(Result.ok<StudyCycle[]>(request.result));
      };

      request.onerror = () => {
        logger.error('Failed to get study cycles from IndexedDB');
        resolve(Result.fail<StudyCycle[]>('Failed to get study cycles from IndexedDB'));
      };
    });
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<Result<void>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<void>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      const request = store.put(cycle);

      request.onsuccess = () => {
        resolve(Result.ok<void>(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to save study cycle to IndexedDB');
        resolve(Result.fail<void>('Failed to save study cycle to IndexedDB'));
      };
    });
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<Result<void>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<void>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      const requests = cycles.map(cycle => store.put(cycle));

      Promise.all(requests.map(request => new Promise<void>((res, rej) => {
        request.onsuccess = () => res();
        request.onerror = () => rej(request.error);
      })))
        .then(() => resolve(Result.ok<void>(undefined)))
        .catch(error => {
          logger.error('Failed to save study cycles to IndexedDB');
          resolve(Result.fail<void>('Failed to save study cycles to IndexedDB'));
        });
    });
  }

  async clearStudyCycles(): Promise<Result<void>> {
    if (!this.db) {
      logger.error('IndexedDB not initialized');
      return Result.fail<void>('IndexedDB not initialized');
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      const request = store.clear();

      request.onsuccess = () => {
        resolve(Result.ok<void>(undefined));
      };

      request.onerror = () => {
        logger.error('Failed to clear study cycles from IndexedDB');
        resolve(Result.fail<void>('Failed to clear study cycles from IndexedDB'));
      };
    });
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    return {
      size: 0,
      lastUpdated: new Date()
    };
  }

  async invalidateCache(): Promise<Result<void>> {
    // Pode ser só um stub por enquanto
    return Result.ok(undefined);
  }

} 