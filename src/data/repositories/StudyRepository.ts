import { Study } from '../models/Study';
import { StorageAdapter } from '../adapters/StorageAdapter';

export class StudyRepository {
  constructor(private storage: StorageAdapter) {}

  async getStudies(): Promise<Study[]> {
    return this.storage.getStudies();
  }

  async saveStudy(study: Study): Promise<void> {
    await this.storage.saveStudy(study);
  }

  async saveStudies(studies: Study[]): Promise<void> {
    for (const study of studies) {
      await this.saveStudy(study);
    }
  }
} 