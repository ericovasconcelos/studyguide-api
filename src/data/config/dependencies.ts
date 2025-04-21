import { ServerSyncAdapter } from '../adapters/ServerSyncAdapter';
import { CompositeAdapter } from '../adapters/CompositeAdapter';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { StudyRepository } from '../repositories/StudyRepository';
import { logger } from '../../utils/logger';
import { getApiUrl } from '../../config/env';
import { getCurrentUserId } from '../../config/auth';
import { DataCleanupService } from '../../services/DataCleanupService';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';

const localAdapter = new LocalStorageAdapter();
export const cleanupService = new DataCleanupService(localAdapter);
// Obter ID do usuário do sistema de autenticação
const USER_ID = getCurrentUserId();

// Criar instâncias dos adaptadores
const indexedDBAdapter = new IndexedDBAdapter();
const serverSyncAdapter = new ServerSyncAdapter(indexedDBAdapter, USER_ID);
const compositeAdapter = new CompositeAdapter(indexedDBAdapter, serverSyncAdapter);

// Criar instâncias dos repositórios
const studyRepository = new StudyRepository(compositeAdapter);

// Criar instâncias dos serviços
const studyService = new StudyService(compositeAdapter, serverSyncAdapter, USER_ID);

// Exportar as dependências
export {
  studyService,
  studyRepository,
  indexedDBAdapter,
  serverSyncAdapter,
  compositeAdapter,
  USER_ID // Exportar o ID do usuário para uso em outros componentes
}; 