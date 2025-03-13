import { Study } from '../models/Study';
import { StudyRepository } from '../repositories/StudyRepository';

export class StudyService {
  constructor(private repository: StudyRepository) {}

  async addStudyRecord(study: Study): Promise<Study> {
    // Validação básica
    if (!study.subject || !study.timeSpent) {
      throw new Error('Dados de estudo inválidos');
    }

    await this.repository.saveStudy(study);
    return study;
  }

  async getAll(): Promise<Study[]> {
    return this.repository.getStudies();
  }

  async getStudyStatistics() {
    const studies = await this.repository.getStudies();

    return {
      totalStudyTime: this.calculateTotalStudyTime(studies),
      totalExercises: studies.reduce((sum: number, s: Study) => sum + (s.questions || 0), 0),
      correctAnswers: studies.reduce((sum: number, s: Study) => sum + (s.correctAnswers || 0), 0),
    };
  }

  private calculateTotalStudyTime(studies: Study[]): number {
    return studies.reduce((total: number, study: Study) => {
      return total + study.timeSpent;
    }, 0);
  }
} 