import { StorageAdapter } from '../../domain/interfaces/StorageAdapter';
import { Study } from '../../domain/entities/Study';
import { Result } from '../../domain/result';
import { logger } from '../../utils/logger';
import { StudyCycle } from '../models/StudyCycle';

export class CompositeAdapter implements StorageAdapter {
  constructor(
    private readonly localAdapter: StorageAdapter,
    private readonly serverAdapter: StorageAdapter
  ) {}

  async getStudies(): Promise<Result<Study[]>> {
    try {
      // Primeiro tenta buscar do servidor
      const serverResult = await this.serverAdapter.getStudies();
      if (serverResult.isSuccessful()) {
        return serverResult;
      }

      // Se falhar, busca do localStorage
      const localResult = await this.localAdapter.getStudies();
      if (localResult.isSuccessful()) {
        logger.warn('Falha ao buscar do servidor, usando dados locais');
      }
      return localResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao buscar estudos:', errorMessage);
      return Result.fail('Erro ao buscar estudos');
    }
  }

  async saveStudy(study: Study): Promise<Result<void>> {
    try {
      // Salva localmente primeiro
      const localResult = await this.localAdapter.saveStudy(study);
      if (!localResult.isSuccessful()) {
        return localResult;
      }

      // Depois tenta sincronizar com o servidor
      const serverResult = await this.serverAdapter.saveStudy(study);
      if (!serverResult.isSuccessful()) {
        logger.warn('Falha ao salvar no servidor, mantendo apenas local');
      }

      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao salvar estudo:', errorMessage);
      return Result.fail('Erro ao salvar estudo');
    }
  }

  async updateStudy(study: Study): Promise<Result<void>> {
    try {
      // Atualiza localmente primeiro
      const localResult = await this.localAdapter.updateStudy(study);
      if (!localResult.isSuccessful()) {
        return localResult;
      }

      // Depois tenta sincronizar com o servidor
      const serverResult = await this.serverAdapter.updateStudy(study);
      if (!serverResult.isSuccessful()) {
        logger.warn('Falha ao atualizar no servidor, mantendo apenas local');
      }

      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao atualizar estudo:', errorMessage);
      return Result.fail('Erro ao atualizar estudo');
    }
  }

  async deleteStudy(id: string): Promise<Result<void>> {
    try {
      // Deleta localmente primeiro
      const localResult = await this.localAdapter.deleteStudy(id);
      if (!localResult.isSuccessful()) {
        return localResult;
      }

      // Depois tenta sincronizar com o servidor
      const serverResult = await this.serverAdapter.deleteStudy(id);
      if (!serverResult.isSuccessful()) {
        logger.warn('Falha ao deletar no servidor, mantendo apenas local');
      }

      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao deletar estudo:', errorMessage);
      return Result.fail('Erro ao deletar estudo');
    }
  }

  async sync(): Promise<Result<void>> {
    try {
      // Busca dados do servidor
      const serverResult = await this.serverAdapter.getStudies();
      if (serverResult.isSuccessful()) {
        // Atualiza localmente
        const studies = serverResult.getValue();
        if (studies) {
          for (const study of studies) {
            await this.localAdapter.saveStudy(study);
          }
        }
        return Result.ok(undefined);
      }
      return Result.fail('Erro ao sincronizar');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao sincronizar:', errorMessage);
      return Result.fail('Erro ao sincronizar');
    }
  }

  async invalidateCache(): Promise<Result<void>> {
    try {
      await this.localAdapter.invalidateCache();
      await this.serverAdapter.invalidateCache();
      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao invalidar cache:', errorMessage);
      return Result.fail('Erro ao invalidar cache');
    }
  }

  async clearStudies(): Promise<Result<void>> {
    try {
      // Try server first
      try {
        const serverResult = await this.serverAdapter.clearStudies();
        if (serverResult.failed()) {
          logger.warn(`Server clear failed: ${serverResult.getError()}`);
        }
      } catch (error) {
        logger.warn('Server clear failed:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Always clear local
      const localResult = await this.localAdapter.clearStudies();
      if (localResult.failed()) {
        return localResult; // Return the local error
      }

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error in clearStudies', error);
      return Result.fail(error instanceof Error ? error.message : 'Unknown error in clearStudies');
    }
  }

  async getStudyCycles(): Promise<Result<StudyCycle[]>> {
    try {
      // Primeiro tenta buscar do servidor
      const serverResult = await this.serverAdapter.getStudyCycles();
      if (serverResult.isSuccessful()) {
        return serverResult;
      }

      // Se falhar, busca do localStorage
      const localResult = await this.localAdapter.getStudyCycles();
      if (localResult.isSuccessful()) {
        logger.warn('Falha ao buscar ciclos de estudo do servidor, usando dados locais');
      }
      return localResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao buscar ciclos de estudo:', errorMessage);
      return Result.fail('Erro ao buscar ciclos de estudo');
    }
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<Result<void>> {
    try {
      // Salva localmente primeiro
      const localResult = await this.localAdapter.saveStudyCycle(cycle);
      if (!localResult.isSuccessful()) {
        return localResult;
      }

      // Depois tenta sincronizar com o servidor
      const serverResult = await this.serverAdapter.saveStudyCycle(cycle);
      if (!serverResult.isSuccessful()) {
        logger.warn('Falha ao salvar ciclo no servidor, mantendo apenas local');
      }

      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao salvar ciclo de estudo:', errorMessage);
      return Result.fail('Erro ao salvar ciclo de estudo');
    }
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<Result<void>> {
    try {
      // Salva localmente primeiro
      const localResult = await this.localAdapter.saveStudyCycles(cycles);
      if (!localResult.isSuccessful()) {
        return localResult;
      }

      // Depois tenta sincronizar com o servidor
      const serverResult = await this.serverAdapter.saveStudyCycles(cycles);
      if (!serverResult.isSuccessful()) {
        logger.warn('Falha ao salvar ciclos no servidor, mantendo apenas local');
      }

      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao salvar ciclos de estudo:', errorMessage);
      return Result.fail('Erro ao salvar ciclos de estudo');
    }
  }

  async clearStudyCycles(): Promise<Result<void>> {
    try {
      // Limpa dados locais primeiro
      const localResult = await this.localAdapter.clearStudyCycles();
      if (!localResult.isSuccessful()) {
        return localResult;
      }

      // Depois tenta limpar no servidor
      const serverResult = await this.serverAdapter.clearStudyCycles();
      if (!serverResult.isSuccessful()) {
        logger.warn('Falha ao limpar ciclos no servidor, mantendo apenas local');
      }

      return Result.ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao limpar ciclos de estudo:', errorMessage);
      return Result.fail('Erro ao limpar ciclos de estudo');
    }
  }
} 