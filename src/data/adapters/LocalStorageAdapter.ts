import { StorageAdapter } from './StorageAdapter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly STUDIES_KEY = 'studies';
  private readonly CYCLES_KEY = 'studyCycles';
  private readonly LAST_UPDATE_KEY = 'lastUpdate';

  // Study methods
  async getStudies(): Promise<Study[]> {
    const data = localStorage.getItem(this.STUDIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveStudy(study: Study): Promise<void> {
    const studies = await this.getStudies();
    const index = studies.findIndex(s => s.id === study.id);
    if (index >= 0) {
      studies[index] = study;
    } else {
      studies.push(study);
    }
    localStorage.setItem(this.STUDIES_KEY, JSON.stringify(studies));
    this.updateLastSync();
  }

  async saveStudies(studies: Study[]): Promise<void> {
    const existingStudies = await this.getStudies();
    const merged = this.mergeArrays(existingStudies, studies);
    localStorage.setItem(this.STUDIES_KEY, JSON.stringify(merged));
    this.updateLastSync();
  }

  async clearStudies(): Promise<void> {
    localStorage.removeItem(this.STUDIES_KEY);
    this.updateLastSync();
  }

  // StudyCycle methods
  async getStudyCycles(): Promise<StudyCycle[]> {
    const data = localStorage.getItem(this.CYCLES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<void> {
    const cycles = await this.getStudyCycles();
    const index = cycles.findIndex(c => c.id === cycle.id);
    if (index >= 0) {
      cycles[index] = cycle;
    } else {
      cycles.push(cycle);
    }
    localStorage.setItem(this.CYCLES_KEY, JSON.stringify(cycles));
    this.updateLastSync();
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<void> {
    const existingCycles = await this.getStudyCycles();
    const merged = this.mergeArrays(existingCycles, cycles);
    localStorage.setItem(this.CYCLES_KEY, JSON.stringify(merged));
    this.updateLastSync();
  }

  async clearStudyCycles(): Promise<void> {
    localStorage.removeItem(this.CYCLES_KEY);
    this.updateLastSync();
  }

  // General methods
  async clear(): Promise<void> {
    await this.clearStudies();
    await this.clearStudyCycles();
  }

  async invalidateCache(): Promise<void> {
    await this.clear();
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    const lastUpdate = localStorage.getItem(this.LAST_UPDATE_KEY);
    const studies = await this.getStudies();
    const cycles = await this.getStudyCycles();
    
    return {
      size: studies.length + cycles.length,
      lastUpdated: lastUpdate ? new Date(lastUpdate) : new Date()
    };
  }

  private updateLastSync(): void {
    localStorage.setItem(this.LAST_UPDATE_KEY, new Date().toISOString());
  }

  // Import methods (new)
  async findDuplicateStudies(studies: Study[]): Promise<Study[]> {
    const existingStudies = await this.getStudies();
    return studies.filter(newStudy => 
      existingStudies.some(existing => existing.id === newStudy.id)
    );
  }

  async bulkUpsertStudies(studies: Study[]): Promise<void> {
    await this.saveStudies(studies);
  }

  private mergeArrays<T extends { id?: string | number }>(existing: T[], incoming: T[]): T[] {
    const merged = new Map<string | number, T>();
    
    existing.forEach(item => {
      if (item.id !== undefined) {
        merged.set(item.id, item);
      }
    });
    
    incoming.forEach(item => {
      if (item.id !== undefined) {
        merged.set(item.id, item);
      }
    });
    
    return Array.from(merged.values());
  }
} 