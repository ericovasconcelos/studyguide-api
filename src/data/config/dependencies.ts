import { StudyCycleService } from '../services/StudyCycleService';
import { ImportService } from '../../services/ImportService';
import { StudyService } from '../services/StudyService';
import { ServerSyncAdapter } from '../adapters/ServerSyncAdapter';
import { CompositeAdapter } from '../adapters/CompositeAdapter';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { StudyRepository } from '../repositories/StudyRepository';
import { StudyCycleRepository } from '../repositories/StudyCycleRepository';
import { DataCleanupService } from '../../services/DataCleanupService';
import { logger } from '../../utils/logger';
import { config } from '../../config/env';
import { getCurrentUserId } from '../../config/auth';

// Obter ID do usuário do sistema de autenticação
const USER_ID = getCurrentUserId();

// Criar instâncias dos adaptadores
const indexedDBAdapter = new IndexedDBAdapter();
const serverSyncAdapter = new ServerSyncAdapter(indexedDBAdapter, USER_ID);
const compositeAdapter = new CompositeAdapter(indexedDBAdapter, serverSyncAdapter);

// Criar instâncias dos repositórios
const studyRepository = new StudyRepository(compositeAdapter);
const studyCycleRepository = new StudyCycleRepository(compositeAdapter);

// Criar instâncias dos serviços
const studyCycleService = new StudyCycleService(studyCycleRepository);
const importService = new ImportService(studyRepository);
const studyService = new StudyService(compositeAdapter, serverSyncAdapter, USER_ID);

// Exportar as dependências
export {
  studyService,
  studyCycleService,
  importService,
  studyRepository,
  studyCycleRepository,
  indexedDBAdapter,
  serverSyncAdapter,
  compositeAdapter,
  USER_ID // Exportar o ID do usuário para uso em outros componentes
}; 