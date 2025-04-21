import { ServerSyncAdapter } from '../adapters/ServerSyncAdapter';
import { CompositeAdapter as DataCompositeAdapter } from '../adapters/CompositeAdapter';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { StudyRepository } from '../repositories/StudyRepository';
import { getCurrentUserId } from '../../config/auth';
import { DataCleanupService } from '../../services/DataCleanupService';
import { LocalStorageAdapter } from '../adapters/LocalStorageAdapter';
import { StudyCycleService } from "../services/StudyCycleService";
import { StudyService } from '../services/StudyService';
import { ImportService } from '../../services/ImportService';

const localAdapter = new LocalStorageAdapter();
// Obter ID do usuário do sistema de autenticação
const USER_ID = getCurrentUserId();

// Criar instâncias dos adaptadores
const indexedDBAdapter = new IndexedDBAdapter();
const serverSyncAdapter = new ServerSyncAdapter(USER_ID);
const compositeAdapter = new DataCompositeAdapter(indexedDBAdapter, serverSyncAdapter);

// Criar instâncias dos repositórios
const studyRepository = new StudyRepository(compositeAdapter);

// Criar serviço de limpeza de dados
export const cleanupService = new DataCleanupService(localAdapter, serverSyncAdapter);

// Criar instâncias dos serviços
const studyService = new StudyService();
const importService = new ImportService(studyRepository);

// Exportar as dependências
export {
  studyService,
  importService,
  studyRepository,
  indexedDBAdapter,
  serverSyncAdapter,
  compositeAdapter,
  USER_ID, // Exportar o ID do usuário para uso em outros componentes
  StudyCycleService,
}; 