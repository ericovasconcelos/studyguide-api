import { StudyCycle } from '../models/StudyCycle';
import { StudyCycleRepository } from '../repositories/StudyCycleRepository';

export class StudyCycleService {
  constructor(private repository: StudyCycleRepository) {}

  async getCycles(): Promise<StudyCycle[]> {
    return this.repository.getAll();
  }

  async saveCycle(cycle: StudyCycle): Promise<void> {
    await this.repository.save(cycle);
  }

  async updateCycles(cycles: StudyCycle[]): Promise<void> {
    // Limpa ciclos existentes e salva os novos
    await this.repository.clear();
    for (const cycle of cycles) {
      await this.repository.save(cycle);
    }
  }
} 