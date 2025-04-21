import { StorageAdapter } from '../data/adapters/StorageAdapter';
import { ServerSyncAdapter } from '../data/adapters/ServerSyncAdapter';
import { Study } from '../data/models/Study';
import { StudyCycle } from '../data/models/StudyCycle';

export enum CleanupScope {
  LOCAL = 'local',
  SERVER = 'server'
}

export enum LocalDataTypes {
  USER_SETTINGS = 'user_settings',
  APPLICATION_DATA = 'application_data',
  ALL_LOCAL = 'all_local'
}

export enum ServerDataTypes {
  USER_DATA = 'user_data',
  SYSTEM_DATA = 'system_data',
  ALL_SERVER = 'all_server'
}

export interface CleanupResult {
  success: boolean;
  message: string;
  details?: {
    [key: string]: number;
  };
}

export class DataCleanupService {
  constructor(
    private storageAdapter: StorageAdapter,
    private serverSyncAdapter: ServerSyncAdapter
  ) {}

  async cleanupLocalData(types: LocalDataTypes[]): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      message: 'Limpeza local concluída com sucesso',
      details: {}
    };

    try {
      for (const type of types) {
        switch (type) {
          case LocalDataTypes.USER_SETTINGS:
            await this.clearUserSettings();
            result.details![LocalDataTypes.USER_SETTINGS] = 1;
            break;
          case LocalDataTypes.APPLICATION_DATA:
            await this.clearApplicationData();
            result.details![LocalDataTypes.APPLICATION_DATA] = 1;
            break;
          case LocalDataTypes.ALL_LOCAL:
            await this.clearAllLocalData();
            result.details![LocalDataTypes.ALL_LOCAL] = 1;
            break;
        }
      }
    } catch (error) {
      result.success = false;
      result.message = `Erro durante a limpeza local: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }

    return result;
  }

  async cleanupServerData(types: ServerDataTypes[]): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      message: 'Limpeza do servidor concluída com sucesso',
      details: {}
    };

    try {
      for (const type of types) {
        switch (type) {
          case ServerDataTypes.USER_DATA:
            await this.clearUserServerData();
            result.details![ServerDataTypes.USER_DATA] = 1;
            break;
          case ServerDataTypes.SYSTEM_DATA:
            await this.clearSystemServerData();
            result.details![ServerDataTypes.SYSTEM_DATA] = 1;
            break;
          case ServerDataTypes.ALL_SERVER:
            await this.clearAllServerData();
            result.details![ServerDataTypes.ALL_SERVER] = 1;
            break;
        }
      }
    } catch (error) {
      result.success = false;
      result.message = `Erro durante a limpeza do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
    }

    return result;
  }

  private async clearUserSettings(): Promise<void> {
    // Limpa configurações do usuário no localStorage
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('granToken');
    localStorage.removeItem('themeSettings');
  }

  private async clearApplicationData(): Promise<void> {
    // Limpa dados da aplicação no IndexedDB
    await this.storageAdapter.clearStudies();
  }

  private async clearAllLocalData(): Promise<void> {
    // Limpa todos os dados locais
    await this.clearUserSettings();
    await this.clearApplicationData();
    localStorage.clear();
  }

  private async clearUserServerData(): Promise<void> {
    // Limpa dados do usuário no servidor
    await this.serverSyncAdapter.clearUserData();
  }

  private async clearSystemServerData(): Promise<void> {
    // Limpa dados do sistema no servidor
    await this.serverSyncAdapter.clearSystemData();
  }

  private async clearAllServerData(): Promise<void> {
    // Limpa todos os dados do servidor
    await this.clearUserServerData();
    await this.clearSystemServerData();
  }
} 