import { StorageAdapter } from './StorageAdapter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export class LocalStorageAdapter implements StorageAdapter {
  private readonly STUDIES_KEY = 'studies';
  private readonly CYCLES_KEY = 'cycles';
  private readonly LAST_UPDATE_KEY = 'lastUpdate';

  // Study methods
  async getStudies(): Promise<Study[]> {
    const data = localStorage.getItem(this.STUDIES_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveStudy(study: Study): Promise<void> {
    const studies = await this.getStudies();
    studies.push(study);
    localStorage.setItem(this.STUDIES_KEY, JSON.stringify(studies));
    this.updateLastSync();
  }

  async bulkSaveStudies(studies: Study[]): Promise<void> {
    localStorage.setItem(this.STUDIES_KEY, JSON.stringify(studies));
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
    cycles.push(cycle);
    localStorage.setItem(this.CYCLES_KEY, JSON.stringify(cycles));
    this.updateLastSync();
  }

  async bulkSaveCycles(cycles: StudyCycle[]): Promise<void> {
    localStorage.setItem(this.CYCLES_KEY, JSON.stringify(cycles));
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
    localStorage.removeItem(this.LAST_UPDATE_KEY);
  }

  async invalidateCache(): Promise<void> {
    await this.clear();
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    const studies = await this.getStudies();
    const cycles = await this.getStudyCycles();
    const lastUpdated = localStorage.getItem(this.LAST_UPDATE_KEY);

    return {
      size: studies.length + cycles.length,
      lastUpdated: lastUpdated ? new Date(lastUpdated) : new Date()
    };
  }

  private updateLastSync(): void {
    localStorage.setItem(this.LAST_UPDATE_KEY, new Date().toISOString());
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
    const existingStudies = await this.getStudies();
    
    // Remover duplicatas existentes
    const filteredExisting = existingStudies.filter(existing => 
      !studies.some(newStudy => 
        existing.date === newStudy.date && 
        existing.subject === newStudy.subject
      )
    );

    // Combinar estudos existentes com novos
    const updatedStudies = [...filteredExisting, ...studies];
    
    // Salvar usando o método existente
    await this.bulkSaveStudies(updatedStudies);
  }
} 