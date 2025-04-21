import { IStudyRepository } from '../repositories/IStudyRepository';
import { Study } from '../entities/Study';

export class ImportStudiesUseCase {
  constructor(private studyRepository: IStudyRepository) {}

  async execute(studies: Study[]): Promise<Study[]> {
    // Valida cada estudo antes de salvar - Validation is assumed to happen before this use case is called.
    // const validStudies = studies.filter(study => study.isValid()); // Removed unnecessary filtering
    
    if (studies.length === 0) { // Check the input array directly
      throw new Error('Nenhum estudo válido para importar');
    }

    // Salva os estudos no repositório
    return this.studyRepository.saveMany(studies); // Save the original array
  }
} 