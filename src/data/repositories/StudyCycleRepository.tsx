import { StudyCycle } from '../models/StudyCycle';
import { StorageAdapter } from '../adapters/StorageAdapter';

export class StudyCycleRepository {
  constructor(private storage: StorageAdapter) {}

  async getAll(): Promise<StudyCycle[]> {
    return this.storage.getStudyCycles();
  }

  async save(cycle: StudyCycle): Promise<void> {
    await this.storage.saveStudyCycle(cycle);
  }

  async clear(): Promise<void> {
    await this.storage.clearStudyCycles();
  }
} 