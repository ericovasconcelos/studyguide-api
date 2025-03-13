import { EventEmitter } from '../events/EventEmitter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';
import { StorageAdapter } from './StorageAdapter';

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private readonly eventEmitter: EventEmitter;
  private readonly dbName: string = 'studyguide';
  private readonly storeName: string = 'studies';
  private dbInitPromise: Promise<void>;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.dbInitPromise = this.initDB();
  }

  // Método para obter o eventEmitter
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  // Método para notificar mudanças
  private notifyDataChanged(): void {
    this.eventEmitter.emit('dataChanged');
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Criar store de estudos se não existir
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }

        // Criar store de ciclos se não existir
        if (!db.objectStoreNames.contains('studyCycles')) {
          db.createObjectStore('studyCycles', { keyPath: 'id' });
        }
      };
    });
  }

  async getStudies(): Promise<Study[]> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getStudyCycles(): Promise<StudyCycle[]> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['studyCycles'], 'readonly');
      const store = transaction.objectStore('studyCycles');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveStudy(study: Study): Promise<void> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(study);

      request.onsuccess = () => {
        this.notifyDataChanged();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveStudies(studies: Study[]): Promise<void> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let completed = 0;
      let error: Error | null = null;

      studies.forEach((study) => {
        const request = store.put(study);
        request.onsuccess = () => {
          completed++;
          if (completed === studies.length && !error) {
            this.notifyDataChanged();
            resolve();
          }
        };
        request.onerror = () => {
          if (!error) {
            error = request.error;
            reject(error);
          }
        };
      });
    });
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<void> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      
      let completed = 0;
      let error: Error | null = null;

      cycles.forEach((cycle) => {
        const request = store.put(cycle);
        request.onsuccess = () => {
          completed++;
          if (completed === cycles.length && !error) {
            this.notifyDataChanged();
            resolve();
          }
        };
        request.onerror = () => {
          if (!error) {
            error = request.error;
            reject(error);
          }
        };
      });
    });
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      const request = store.put(cycle);

      request.onsuccess = () => {
        this.notifyDataChanged();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearStudies(): Promise<void> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        this.notifyDataChanged();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearStudyCycles(): Promise<void> {
    await this.dbInitPromise;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      const request = store.clear();

      request.onsuccess = () => {
        this.notifyDataChanged();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.dbInitPromise;
    await Promise.all([this.clearStudies(), this.clearStudyCycles()]);
  }

  async findDuplicateStudies(studies: Study[]): Promise<Study[]> {
    await this.dbInitPromise;
    const existingStudies = await this.getStudies();
    return studies.filter(study => existingStudies.some(existingStudy => existingStudy.id === study.id));
  }

  async bulkUpsertStudies(studies: Study[]): Promise<void> {
    await this.dbInitPromise;
    await this.saveStudies(studies);
  }
} 