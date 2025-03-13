import { EventEmitter } from '../events/EventEmitter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export class IndexedDBAdapter {
  private eventEmitter: EventEmitter;
  private dbName: string = 'studyguide';
  private storeName: string = 'studies';

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  // Método para obter o eventEmitter
  getEventEmitter(): EventEmitter {
    return this.eventEmitter;
  }

  // Método para notificar mudanças
  private notifyDataChanged(): void {
    this.eventEmitter.emit('dataChanged');
  }

  async getStudies(): Promise<Study[]> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          resolve(getAllRequest.result);
        };

        getAllRequest.onerror = () => reject(getAllRequest.error);
      };
    });
  }

  async saveStudy(study: Study): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const saveRequest = store.put(study);

        saveRequest.onsuccess = () => {
          this.notifyDataChanged();
          resolve();
        };

        saveRequest.onerror = () => reject(saveRequest.error);
      };
    });
  }

  async saveStudies(studies: Study[]): Promise<void> {
    const promises = studies.map(study => this.saveStudy(study));
    await Promise.all(promises);
    this.notifyDataChanged();
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    // ... código existente de salvamento ...
    this.notifyDataChanged();
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<void> {
    // ... código existente de salvamento ...
    this.notifyDataChanged();
  }

  // ... resto do código existente ...
} 