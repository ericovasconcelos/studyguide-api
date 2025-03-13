import { StorageAdapter } from './StorageAdapter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

const STORAGE_KEYS = {
  STUDIES: 'studies',
  CYCLES: 'cycles',
  LAST_UPDATED: 'lastUpdated'
};

export class LocalStorageAdapter implements StorageAdapter {
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
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      // Load studies
      const studiesJson = localStorage.getItem(STORAGE_KEYS.STUDIES);
      if (studiesJson) {
        const studies = JSON.parse(studiesJson) as Study[];
        this.cache.studies.clear();
        studies.forEach(study => this.cache.studies.set(study.id!, study));
      }

      // Load cycles
      const cyclesJson = localStorage.getItem(STORAGE_KEYS.CYCLES);
      if (cyclesJson) {
        const cycles = JSON.parse(cyclesJson) as StudyCycle[];
        this.cache.cycles.clear();
        cycles.forEach(cycle => this.cache.cycles.set(cycle.id!, cycle));
      }

      // Load last update time
      const lastUpdated = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      this.cache.lastSync = lastUpdated ? new Date(lastUpdated) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      // Save studies
      const studies = Array.from(this.cache.studies.values());
      localStorage.setItem(STORAGE_KEYS.STUDIES, JSON.stringify(studies));

      // Save cycles
      const cycles = Array.from(this.cache.cycles.values());
      localStorage.setItem(STORAGE_KEYS.CYCLES, JSON.stringify(cycles));

      // Update last sync time
      const now = new Date();
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, now.toISOString());
      this.cache.lastSync = now;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Study methods
  async getStudies(): Promise<Study[]> {
    return Array.from(this.cache.studies.values());
  }

  async saveStudy(study: Study): Promise<void> {
    if (!study.id) {
      throw new Error('Study must have an ID');
    }

    this.cache.studies.set(study.id, study);
    this.saveToStorage();
  }

  async bulkSaveStudies(studies: Study[]): Promise<void> {
    // Validate all studies have IDs
    if (studies.some(study => !study.id)) {
      throw new Error('All studies must have IDs');
    }

    this.cache.studies.clear();
    studies.forEach(study => this.cache.studies.set(study.id!, study));
    this.saveToStorage();
  }

  async clearStudies(): Promise<void> {
    this.cache.studies.clear();
    this.saveToStorage();
  }

  // StudyCycle methods
  async getStudyCycles(): Promise<StudyCycle[]> {
    return Array.from(this.cache.cycles.values());
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    if (!cycle.id) {
      throw new Error('Study cycle must have an ID');
    }

    this.cache.cycles.set(cycle.id, cycle);
    this.saveToStorage();
  }

  async bulkSaveCycles(cycles: StudyCycle[]): Promise<void> {
    // Validate all cycles have IDs
    if (cycles.some(cycle => !cycle.id)) {
      throw new Error('All study cycles must have IDs');
    }

    this.cache.cycles.clear();
    cycles.forEach(cycle => this.cache.cycles.set(cycle.id!, cycle));
    this.saveToStorage();
  }

  async clearStudyCycles(): Promise<void> {
    this.cache.cycles.clear();
    this.saveToStorage();
  }

  // General methods
  async clear(): Promise<void> {
    this.cache.studies.clear();
    this.cache.cycles.clear();
    this.saveToStorage();
  }

  async invalidateCache(): Promise<void> {
    this.loadFromStorage();
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    return {
      size: this.cache.studies.size + this.cache.cycles.size,
      lastUpdated: this.cache.lastSync || new Date()
    };
  }
} 