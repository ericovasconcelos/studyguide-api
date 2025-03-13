import { StorageAdapter } from './StorageAdapter';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { LocalStorageAdapter } from './LocalStorageAdapter';
import { ServerSyncAdapter } from './ServerSyncAdapter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export class CompositeStorageAdapter implements StorageAdapter {
  private readonly primaryStorage: IndexedDBAdapter;
  private readonly cacheStorage: StorageAdapter;
  private readonly syncAdapter: ServerSyncAdapter;
  private isSyncing: boolean = false;
  private autoSyncInterval: number | null = null;

  constructor(userId: string) {
    this.primaryStorage = new IndexedDBAdapter();
    this.cacheStorage = new LocalStorageAdapter();
    this.syncAdapter = new ServerSyncAdapter(this.primaryStorage, userId);
    this.initializeSync();
    this.startAutoSync();
  }

  private async initializeSync(): Promise<void> {
    if (navigator.onLine) {
      await this.syncWithServer();
    }

    window.addEventListener('online', () => this.syncWithServer());
  }

  private startAutoSync(): void {
    if (this.autoSyncInterval) return;
    
    // Sincronizar a cada 5 minutos quando online
    this.autoSyncInterval = window.setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncWithServer();
      }
    }, 5 * 60 * 1000);
  }

  private stopAutoSync(): void {
    if (this.autoSyncInterval) {
      window.clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  private async syncWithServer(): Promise<void> {
    if (this.isSyncing) return;
    
    try {
      this.isSyncing = true;
      
      // Upload local changes
      const studies = await this.primaryStorage.getStudies();
      const cycles = await this.primaryStorage.getStudyCycles();
      
      const { timestamp } = await this.syncAdapter.uploadChanges({ studies, cycles });
      
      // Download changes from server
      const lastSync = this.syncAdapter.getLastSyncTimestamp() || new Date(0);
      const serverChanges = await this.syncAdapter.downloadChanges(lastSync);
      
      // Merge changes
      await this.mergeChanges(serverChanges);
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async mergeChanges(serverChanges: { studies: Study[]; cycles: StudyCycle[]; timestamp: Date }): Promise<void> {
    const localStudies = await this.primaryStorage.getStudies();
    const localCycles = await this.primaryStorage.getStudyCycles();
    
    // Merge studies (prefer server version if conflict)
    const mergedStudies = this.mergeArrays<Study>(localStudies, serverChanges.studies, 'id');
    
    // Merge cycles (prefer server version if conflict)
    const mergedCycles = this.mergeArrays<StudyCycle>(localCycles, serverChanges.cycles, 'id');
    
    // Update both storages
    await this.primaryStorage.saveStudies(mergedStudies);
    await this.primaryStorage.saveStudyCycles(mergedCycles);
    
    await this.cacheStorage.saveStudies(mergedStudies);
    await this.cacheStorage.saveStudyCycles(mergedCycles);
  }

  private mergeArrays<T extends { id?: string | number }>(local: T[], server: T[], idField: keyof T): T[] {
    const merged = new Map<string | number, T>();
    
    // Add all local items
    local.forEach(item => {
      if (item[idField] !== undefined) {
        merged.set(item[idField] as string | number, item);
      }
    });
    
    // Override with server items (they take precedence)
    server.forEach(item => {
      if (item[idField] !== undefined) {
        merged.set(item[idField] as string | number, item);
      }
    });
    
    return Array.from(merged.values());
  }

  // Study methods
  async getStudies(): Promise<Study[]> {
    try {
      const studies = await this.primaryStorage.getStudies();
      // Update cache in background
      this.syncWithServer();
      return studies;
    } catch (error) {
      console.warn('Failed to get studies from IndexedDB, falling back to localStorage:', error);
      return this.cacheStorage.getStudies();
    }
  }

  async saveStudy(study: Study): Promise<void> {
    try {
      await this.primaryStorage.saveStudy(study);
      await this.cacheStorage.saveStudy(study);
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to save study to IndexedDB, saving only to localStorage:', error);
      await this.cacheStorage.saveStudy(study);
    }
  }

  async saveStudies(studies: Study[]): Promise<void> {
    try {
      await this.primaryStorage.saveStudies(studies);
      await this.cacheStorage.saveStudies(studies);
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to save studies to IndexedDB, saving only to localStorage:', error);
      await this.cacheStorage.saveStudies(studies);
    }
  }

  async clearStudies(): Promise<void> {
    try {
      await this.primaryStorage.clearStudies();
      await this.cacheStorage.clearStudies();
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to clear studies from IndexedDB, clearing only localStorage:', error);
      await this.cacheStorage.clearStudies();
    }
  }

  // StudyCycle methods
  async getStudyCycles(): Promise<StudyCycle[]> {
    try {
      const cycles = await this.primaryStorage.getStudyCycles();
      // Update cache in background
      this.syncWithServer();
      return cycles;
    } catch (error) {
      console.warn('Failed to get study cycles from IndexedDB, falling back to localStorage:', error);
      return this.cacheStorage.getStudyCycles();
    }
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    try {
      await this.primaryStorage.saveStudyCycle(cycle);
      await this.cacheStorage.saveStudyCycle(cycle);
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to save study cycle to IndexedDB, saving only to localStorage:', error);
      await this.cacheStorage.saveStudyCycle(cycle);
    }
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<void> {
    try {
      await this.primaryStorage.saveStudyCycles(cycles);
      await this.cacheStorage.saveStudyCycles(cycles);
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to save cycles to IndexedDB, saving only to localStorage:', error);
      await this.cacheStorage.saveStudyCycles(cycles);
    }
  }

  async clearStudyCycles(): Promise<void> {
    try {
      await this.primaryStorage.clearStudyCycles();
      await this.cacheStorage.clearStudyCycles();
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to clear study cycles from IndexedDB, clearing only localStorage:', error);
      await this.cacheStorage.clearStudyCycles();
    }
  }

  // General methods
  async clear(): Promise<void> {
    try {
      await this.primaryStorage.clear();
      await this.cacheStorage.clear();
      if (navigator.onLine) {
        this.syncWithServer();
      }
    } catch (error) {
      console.warn('Failed to clear IndexedDB, clearing only localStorage:', error);
      await this.cacheStorage.clear();
    }
  }

  async invalidateCache(): Promise<void> {
    await this.cacheStorage.clear();
    await this.syncWithServer();
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    if (this.cacheStorage.getCacheStatus) {
      return this.cacheStorage.getCacheStatus();
    }
    return { size: 0, lastUpdated: new Date() };
  }

  // Import methods (new)
  async findDuplicateStudies(studies: Study[]): Promise<Study[]> {
    try {
      return await this.primaryStorage.findDuplicateStudies?.(studies) || [];
    } catch (error) {
      console.warn('Failed to find duplicates in IndexedDB, falling back to localStorage:', error);
      return this.cacheStorage.findDuplicateStudies?.(studies) || [];
    }
  }

  async bulkUpsertStudies(studies: Study[]): Promise<void> {
    try {
      await this.primaryStorage.bulkUpsertStudies?.(studies);
      // Atualizar cache em background
      this.syncWithServer();
    } catch (error) {
      console.warn('Failed to upsert studies to IndexedDB, falling back to localStorage:', error);
      await this.cacheStorage.bulkUpsertStudies?.(studies);
    }
  }

  // Cleanup method
  destroy(): void {
    this.stopAutoSync();
    window.removeEventListener('online', () => this.syncWithServer());
  }
} 