import { StorageAdapter } from './StorageAdapter';
import { Study } from '../../domain/entities/Study';
import { Result } from '../../domain/result';
import { logger } from '../../utils/logger';

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
      logger.error('Erro ao buscar estudos:', error);
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
      logger.error('Erro ao salvar estudo:', error);
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
      logger.error('Erro ao atualizar estudo:', error);
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
      logger.error('Erro ao deletar estudo:', error);
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
      logger.error('Erro ao sincronizar:', error);
      return Result.fail('Erro ao sincronizar');
    }
  }

  async invalidateCache(): Promise<Result<void>> {
    try {
      await this.localAdapter.invalidateCache();
      await this.serverAdapter.invalidateCache();
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Erro ao invalidar cache:', error);
      return Result.fail('Erro ao invalidar cache');
    }
  }
} 