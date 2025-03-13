import { StorageAdapter } from '../adapters/StorageAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { StudyService } from '../services/StudyService';
import { StudyCycleService } from '../services/StudyCycleService';
import { StudyRepository } from '../repositories/StudyRepository';
import { StudyCycleRepository } from '../repositories/StudyCycleRepository';
import { ImportService } from '../../services/ImportService';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { StudyServiceImpl } from '../services/StudyService';
import { ServerSyncAdapter } from '../adapters/ServerSyncAdapter';

// Criar instância do adapter de storage
const storageAdapter: StorageAdapter = new LocalStorageAdapter();

// Criar instâncias dos repositórios
const studyRepository = new StudyRepository(storageAdapter);
const studyCycleRepository = new StudyCycleRepository(storageAdapter);

// Criar instâncias dos adaptadores
const indexedDBAdapter = new IndexedDBAdapter();
const serverSyncAdapter = new ServerSyncAdapter('user-123'); // TODO: Implementar autenticação real

// Criar instâncias dos serviços
const studyCycleService = new StudyCycleService(studyCycleRepository);
const importService = new ImportService(studyRepository);
const studyService = new StudyServiceImpl(indexedDBAdapter, serverSyncAdapter, 'user-123');

// Exportar as dependências
export {
  storageAdapter,
  studyRepository,
  studyCycleRepository,
  studyService,
  studyCycleService,
  importService
}; 