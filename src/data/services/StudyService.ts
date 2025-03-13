import { Study } from '../models/Study';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';
import { ServerSyncAdapter } from '../adapters/ServerSyncAdapter';

export interface StudyService {
  getStudies(): Promise<Study[]>;
  getAdapter(): IndexedDBAdapter;
  addStudy(study: Study): Promise<{ success: boolean; error?: string }>;
  importGranRecords(records: Study[]): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
    details: string[];
  }>;
  syncWithServer(): Promise<void>;
}

export class StudyServiceImpl implements StudyService {
  private adapter: IndexedDBAdapter;
  private syncAdapter: ServerSyncAdapter;
  private userId: string;

  constructor(adapter: IndexedDBAdapter, syncAdapter: ServerSyncAdapter, userId: string) {
    this.adapter = adapter;
    this.syncAdapter = syncAdapter;
    this.userId = userId;
  }

  getAdapter(): IndexedDBAdapter {
    return this.adapter;
  }

  async getStudies(): Promise<Study[]> {
    // Primeiro tenta buscar do IndexedDB
    const localStudies = await this.adapter.getStudies();
    
    // Se não houver dados locais, tenta sincronizar com o servidor
    if (localStudies.length === 0) {
      await this.syncWithServer();
      return this.adapter.getStudies();
    }
    
    return localStudies;
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
      const serverData = await this.syncAdapter.downloadChanges(new Date(0));
      
      // Salvar dados localmente
      if (serverData.studies.length > 0) {
        await this.adapter.saveStudies(serverData.studies);
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw new Error('Falha ao sincronizar com o servidor');
    }
  }
} 