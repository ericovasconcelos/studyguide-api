import { IStudyRepository } from '../repositories/IStudyRepository';
import { Study } from '../entities/Study';

export class ImportStudiesUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  async execute(studies: Study[]): Promise<Study[]> {
    // Valida cada estudo antes de salvar
    const validStudies = studies.filter(study => study.isValid());
    
    if (validStudies.length === 0) {
      throw new Error('Nenhum estudo válido para importar');
    }

    // Salva os estudos no repositório
    return this.studyRepository.saveMany(validStudies);
  }
} 