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
import { CompositeStorageAdapter } from '../adapters/CompositeStorageAdapter';

// Configuração do usuário (deve vir de um sistema de autenticação no futuro)
const USER_ID = 'user-123';

// Criar instância do CompositeStorageAdapter que gerencia múltiplos adaptadores
const compositeAdapter = new CompositeStorageAdapter(USER_ID);

// Criar instâncias dos repositórios usando o mesmo adaptador composto
const studyRepository = new StudyRepository(compositeAdapter);
const studyCycleRepository = new StudyCycleRepository(compositeAdapter);

// Criar instância do servidor de sincronização para backups remotos
// Nota: O próprio CompositeStorageAdapter já cria um ServerSyncAdapter, mas mantemos
// esta instância separada para o StudyService
const serverSyncAdapter = new ServerSyncAdapter(compositeAdapter, USER_ID);

// Criar instâncias dos serviços
const studyCycleService = new StudyCycleService(studyCycleRepository);
const importService = new ImportService(studyRepository);
const studyService = new StudyServiceImpl(compositeAdapter, serverSyncAdapter, USER_ID);

// Exportar as dependências
export {
  compositeAdapter,
  studyRepository,
  studyCycleRepository,
  studyService,
  studyCycleService,
  importService
}; 