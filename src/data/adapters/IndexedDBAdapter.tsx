import { StorageAdapter } from './StorageAdapter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

const DB_NAME = 'studyguide_db';
const DB_VERSION = 1;

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private cache: {
    studies: Map<string, Study>;
    cycles: Map<number, StudyCycle>;
    lastSync: Date | null;
  } = {
    studies: new Map(),
    cycles: new Map(),
    lastSync: null
  };

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('studies')) {
          const studyStore = db.createObjectStore('studies', { keyPath: 'id' });
          studyStore.createIndex('date', 'date', { unique: false });
          studyStore.createIndex('subject', 'subject', { unique: false });
        }

        if (!db.objectStoreNames.contains('cycles')) {
          const cycleStore = db.createObjectStore('cycles', { keyPath: 'id', autoIncrement: true });
          cycleStore.createIndex('active', 'active', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Study methods
  async getStudies(): Promise<Study[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['studies'], 'readonly');
      const store = transaction.objectStore('studies');
      const request = store.getAll();

      request.onsuccess = () => {
        const studies = request.result;
        // Update cache
        this.cache.studies.clear();
        studies.forEach(study => this.cache.studies.set(study.id, study));
        resolve(studies);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveStudy(study: Study): Promise<void> {
    if (!study.id) {
      throw new Error('Study must have an ID');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');
      const request = store.put(study);

      request.onsuccess = () => {
        // Update cache
        this.cache.studies.set(study.id!, study);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async bulkSaveStudies(studies: Study[]): Promise<void> {
    // Validate all studies have IDs
    if (studies.some(study => !study.id)) {
      throw new Error('All studies must have IDs');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');

      // Clear existing studies
      store.clear();

      let completed = 0;
      studies.forEach(study => {
        const request = store.put(study);
        request.onsuccess = () => {
          completed++;
          if (completed === studies.length) {
            // Update cache
            this.cache.studies.clear();
            studies.forEach(s => this.cache.studies.set(s.id!, s));
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clearStudies(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');
      const request = store.clear();

      request.onsuccess = () => {
        this.cache.studies.clear();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // StudyCycle methods
  async getStudyCycles(): Promise<StudyCycle[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cycles'], 'readonly');
      const store = transaction.objectStore('cycles');
      const request = store.getAll();

      request.onsuccess = () => {
        const cycles = request.result;
        // Update cache
        this.cache.cycles.clear();
        cycles.forEach(cycle => this.cache.cycles.set(cycle.id, cycle));
        resolve(cycles);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    if (!cycle.id) {
      throw new Error('Study cycle must have an ID');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cycles'], 'readwrite');
      const store = transaction.objectStore('cycles');
      const request = store.put(cycle);

      request.onsuccess = () => {
        // Update cache
        this.cache.cycles.set(cycle.id!, cycle);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async bulkSaveCycles(cycles: StudyCycle[]): Promise<void> {
    // Validate all cycles have IDs
    if (cycles.some(cycle => !cycle.id)) {
      throw new Error('All study cycles must have IDs');
    }

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cycles'], 'readwrite');
      const store = transaction.objectStore('cycles');

      // Clear existing cycles
      store.clear();

      let completed = 0;
      cycles.forEach(cycle => {
        const request = store.put(cycle);
        request.onsuccess = () => {
          completed++;
          if (completed === cycles.length) {
            // Update cache
            this.cache.cycles.clear();
            cycles.forEach(c => this.cache.cycles.set(c.id!, c));
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async clearStudyCycles(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cycles'], 'readwrite');
      const store = transaction.objectStore('cycles');
      const request = store.clear();

      request.onsuccess = () => {
        this.cache.cycles.clear();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // General methods
  async clear(): Promise<void> {
    await this.clearStudies();
    await this.clearStudyCycles();
  }

  // Cache operations
  async invalidateCache(): Promise<void> {
    this.cache.studies.clear();
    this.cache.cycles.clear();
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    return {
      size: this.cache.studies.size + this.cache.cycles.size,
      lastUpdated: new Date()
    };
  }

  // Import methods (new)
  async findDuplicateStudies(studies: Study[]): Promise<Study[]> {
    const existingStudies = await this.getStudies();
    return studies.filter(newStudy => 
      existingStudies.some(existing => 
        existing.date === newStudy.date && 
        existing.subject === newStudy.subject
      )
    );
  }

  async bulkUpsertStudies(studies: Study[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['studies'], 'readwrite');
      const store = transaction.objectStore('studies');

      // Array para armazenar estudos que serão atualizados
      const updatedStudies: Study[] = [];
      let completed = 0;

      studies.forEach(study => {
        // Primeiro, tentar encontrar um estudo existente
        const getRequest = store.index('subject').openCursor(IDBKeyRange.only(study.subject));

        getRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          
          if (cursor) {
            const existingStudy = cursor.value as Study;
            if (existingStudy.date === study.date) {
              // Atualizar estudo existente
              const updateRequest = cursor.update({
                ...existingStudy,
                ...study,
                updatedAt: new Date().toISOString()
              });

              updateRequest.onsuccess = () => {
                updatedStudies.push(study);
                completed++;
                if (completed === studies.length) {
                  this.updateCache(updatedStudies);
                  resolve();
                }
              };

              updateRequest.onerror = () => reject(updateRequest.error);
            } else {
              cursor.continue();
            }
          } else {
            // Estudo não encontrado, adicionar novo
            const addRequest = store.add({
              ...study,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });

            addRequest.onsuccess = () => {
              updatedStudies.push(study);
              completed++;
              if (completed === studies.length) {
                this.updateCache(updatedStudies);
                resolve();
              }
            };

            addRequest.onerror = () => reject(addRequest.error);
          }
        };

        getRequest.onerror = () => reject(getRequest.error);
      });
    });
  }

  private updateCache(studies: Study[]): void {
    studies.forEach(study => {
      if (study.id) {
        this.cache.studies.set(study.id, study);
      }
    });
  }
} 