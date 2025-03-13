import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { ServerSyncAdapter } from '../adapters/ServerSyncAdapter';
import { StorageAdapter } from '../adapters/StorageAdapter';

export interface StudyService {
  getStudies(): Promise<Study[]>;
  getStudyCycles(): Promise<StudyCycle[]>;
  getAdapter(): StorageAdapter;
  addStudy(study: Study): Promise<{ success: boolean; error?: string }>;
  addStudyCycle(cycle: StudyCycle): Promise<{ success: boolean; error?: string }>;
  importGranRecords(records: Study[]): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
    details: string[];
  }>;
  syncWithServer(): Promise<void>;
}

export class StudyServiceImpl implements StudyService {
  private adapter: StorageAdapter;
  private syncAdapter: ServerSyncAdapter;
  private userId: string;

  constructor(adapter: StorageAdapter, syncAdapter: ServerSyncAdapter, userId: string) {
    this.adapter = adapter;
    this.syncAdapter = syncAdapter;
    this.userId = userId;
  }

  getAdapter(): StorageAdapter {
    return this.adapter;
  }

  async getStudies(): Promise<Study[]> {
    try {
      // Primeiro tenta buscar do IndexedDB
      const localStudies = await this.adapter.getStudies();
      
      // Se não houver dados locais, tenta sincronizar com o servidor
      if (localStudies.length === 0) {
        try {
          await this.syncWithServer();
          return this.adapter.getStudies();
        } catch (syncError) {
          console.error('[DEBUG] Erro ao sincronizar durante getStudies:', syncError);
          // Se a sincronização falhar, retorna array vazio em vez de propagar o erro
          return [];
        }
      }
      
      // Se já temos dados locais, retorna-os imediatamente e tenta sincronizar em segundo plano
      // sem bloquear o fluxo principal
      setTimeout(async () => {
        try {
          console.log('[DEBUG] Executando sincronização em segundo plano');
          await this.syncWithServer();
        } catch (bgSyncError) {
          console.error('[DEBUG] Erro na sincronização em segundo plano:', bgSyncError);
          // Erro na sincronização em segundo plano não afeta o fluxo principal
        }
      }, 2000);
      
      return localStudies;
    } catch (error) {
      console.error('[DEBUG] Erro geral em getStudies:', error);
      // Em caso de qualquer outro erro, retorna array vazio
      return [];
    }
  }

  async getStudyCycles(): Promise<StudyCycle[]> {
    try {
      // Primeiro tenta buscar do IndexedDB
      const localCycles = await this.adapter.getStudyCycles();
      
      // Se não houver dados locais, tenta sincronizar com o servidor
      if (localCycles.length === 0) {
        try {
          await this.syncWithServer();
          return this.adapter.getStudyCycles();
        } catch (syncError) {
          console.error('[DEBUG] Erro ao sincronizar durante getStudyCycles:', syncError);
          // Se a sincronização falhar, retorna array vazio em vez de propagar o erro
          return [];
        }
      }
      
      return localCycles;
    } catch (error) {
      console.error('[DEBUG] Erro geral em getStudyCycles:', error);
      // Em caso de qualquer outro erro, retorna array vazio
      return [];
    }
  }

  async addStudy(study: Study): Promise<{ success: boolean; error?: string }> {
    try {
      // Salvar localmente
      await this.adapter.saveStudy(study);
      
      // Sincronizar com o servidor
      await this.syncWithServer();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar estudo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao adicionar estudo'
      };
    }
  }

  async addStudyCycle(cycle: StudyCycle): Promise<{ success: boolean; error?: string }> {
    try {
      // Salvar localmente
      await this.adapter.saveStudyCycles([cycle]);
      
      // Sincronizar com o servidor
      await this.syncWithServer();
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao adicionar ciclo:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao adicionar ciclo'
      };
    }
  }

  async importGranRecords(records: Study[]): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
    details: string[];
  }> {
    // Salvar localmente
    await this.adapter.saveStudies(records);
    
    // Sincronizar com o servidor
    await this.syncWithServer();
    
    return {
      imported: records.length,
      duplicates: 0,
      errors: 0,
      details: ['Importação concluída com sucesso e sincronizada com o servidor']
    };
  }

  async syncWithServer(): Promise<void> {
    try {
      // Buscar dados do servidor
      console.log('[DEBUG] Iniciando sincronização com o servidor...');
      console.log('[DEBUG] Usando userId:', this.userId);
      console.log('[DEBUG] syncAdapter está definido:', !!this.syncAdapter);
      
      try {
        const serverData = await this.syncAdapter.downloadChanges(new Date(0));
        console.log(`[DEBUG] Dados recebidos do servidor: ${serverData.studies.length} estudos e ${serverData.cycles.length} ciclos`);
        
        // Salvar dados localmente
        if (serverData.studies.length > 0) {
          await this.adapter.saveStudies(serverData.studies);
          console.log(`[DEBUG] ${serverData.studies.length} estudos salvos localmente`);
        }
        if (serverData.cycles.length > 0) {
          await this.adapter.saveStudyCycles(serverData.cycles);
          console.log(`[DEBUG] ${serverData.cycles.length} ciclos salvos localmente`);
        }
        console.log('[DEBUG] Sincronização concluída com sucesso');
      } catch (downloadError) {
        console.error('[DEBUG] Erro específico na chamada downloadChanges:', downloadError);
        throw downloadError; // Propagar o erro para o handler geral
      }
    } catch (error) {
      console.error('[DEBUG] Erro na sincronização:', error);
      console.error('[DEBUG] Tipo do erro:', error instanceof Error ? 'Error' : typeof error);
      console.error('[DEBUG] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      // Verificando o tipo de erro
      let errorMessage = 'Falha ao sincronizar com o servidor';
      
      if (error instanceof Error) {
        // Erros de rede
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('Network request failed')) {
          errorMessage = 'Erro de conexão com o servidor. Verifique sua internet.';
        }
        // Erros de API
        else if (error.message.includes('404')) {
          errorMessage = 'API não encontrada. Verifique a URL do servidor.';
        }
        else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Sem permissão para acessar o servidor.';
        }
        else if (error.message.includes('500')) {
          errorMessage = 'Erro interno no servidor. Tente novamente mais tarde.';
        }
        // Erros específicos do IndexedDB
        else if (error.message.includes('Database not initialized')) {
          errorMessage = 'Erro ao inicializar o banco de dados local.';
        }
      }
      
      throw new Error(errorMessage);
    }
  }
} 