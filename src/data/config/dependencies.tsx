import { StorageAdapter } from '../adapters/StorageAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { StudyService } from '../services/StudyService';
import { StudyCycleService } from '../services/StudyCycleService';
import { StudyRepository } from '../repositories/StudyRepository';
import { StudyCycleRepository } from '../repositories/StudyCycleRepository';
import { ImportService } from '../../services/ImportService';

// Criar instância do adapter de storage
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Criar instâncias dos repositórios
const studyRepository = new StudyRepository(storageAdapter);
const studyCycleRepository = new StudyCycleRepository(storageAdapter);

// Criar instâncias dos serviços
const studyService = new StudyService(studyRepository);
const studyCycleService = new StudyCycleService(studyCycleRepository);
const importService = new ImportService(studyRepository);

// Exportar as dependências
export {
  storageAdapter,
  studyRepository,
  studyCycleRepository,
  studyService,
  studyCycleService,
  importService
}; 