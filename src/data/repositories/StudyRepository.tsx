import { Study } from '../models/Study';
import { StorageAdapter } from '../adapters/StorageAdapter';

export class StudyRepository {
  constructor(private storage: StorageAdapter) {}

  async getAll(): Promise<Study[]> {
    return this.storage.getStudies();
  }

  async save(study: Study): Promise<void> {
    await this.storage.saveStudy(study);
  }

  async getByCycle(cycleId: number): Promise<Study[]> {
    const studies = await this.getAll();
    return studies.filter(study => study.cycleId === cycleId);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }
} 