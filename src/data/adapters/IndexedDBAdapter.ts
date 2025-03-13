import { EventEmitter } from '../events/EventEmitter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export class IndexedDBAdapter {
  private db: IDBDatabase | null = null;
  private eventEmitter: EventEmitter;
  private dbName: string = 'studyguide';
  private storeName: string = 'studies';

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.initDB();
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
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const requests = studies.map(study => store.put(study));

      Promise.all(requests.map(request => 
        new Promise<void>((resolveRequest, rejectRequest) => {
          request.onsuccess = () => resolveRequest();
          request.onerror = () => rejectRequest(request.error);
        })
      ))
      .then(() => {
        this.notifyDataChanged();
        resolve();
      })
      .catch(reject);
    });
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(['studyCycles'], 'readwrite');
      const store = transaction.objectStore('studyCycles');
      const requests = cycles.map(cycle => store.put(cycle));

      Promise.all(requests.map(request => 
        new Promise<void>((resolveRequest, rejectRequest) => {
          request.onsuccess = () => resolveRequest();
          request.onerror = () => rejectRequest(request.error);
        })
      ))
      .then(() => {
        this.notifyDataChanged();
        resolve();
      })
      .catch(reject);
    });
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
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
} 