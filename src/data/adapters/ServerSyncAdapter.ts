import { Result } from '../../domain/result';
import { Study } from '../../domain/entities/Study';
import { StorageAdapter } from '../../domain/interfaces/StorageAdapter';
import { logger } from '../../utils/logger';
import axios from 'axios';
import { StudyCycle } from '../models/StudyCycle';

interface SyncData {
  studies: Study[];
  cycles: StudyCycle[];
  timestamp: Date;
}

export class ServerSyncAdapter implements StorageAdapter {
  private readonly API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  private readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getStudies(): Promise<Result<Study[]>> {
    try {
      const response = await fetch(`${this.API_URL}/studies?userId=${this.userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch studies');
      }

      const data = await response.json();
      const studies = data.map((study: any) => Study.fromEntity(study));
      return Result.ok(studies);
    } catch (error) {
      logger.error('Failed to get studies from server', { error });
      return Result.fail('Failed to get studies from server');
    }
  }

  async saveStudy(study: Study): Promise<Result<void>> {
    try {
      const response = await fetch(`${this.API_URL}/studies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(study.toEntity()),
      });

      if (!response.ok) {
        throw new Error('Failed to save study');
      }

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Failed to save study to server', { error });
      return Result.fail('Failed to save study to server');
    }
  }

  async updateStudy(study: Study): Promise<Result<void>> {
    try {
      const response = await fetch(`${this.API_URL}/studies/${study.getId()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(study.toEntity()),
      });

      if (!response.ok) {
        throw new Error('Failed to update study');
      }

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Failed to update study on server', { error });
      return Result.fail('Failed to update study on server');
    }
  }

  async deleteStudy(id: string): Promise<Result<void>> {
    try {
      const response = await fetch(`${this.API_URL}/studies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete study');
      }

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Failed to delete study from server', { error });
      return Result.fail('Failed to delete study from server');
    }
  }

  async sync(): Promise<Result<void>> {
    try {
      const response = await fetch(`${this.API_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync');
      }

      return Result.ok(undefined);
    } catch (error) {
      logger.error('Failed to sync with server', { error });
      return Result.fail('Failed to sync with server');
    }
  }

  async downloadChanges(): Promise<Result<SyncData>> {
    try {
      const response = await axios.get<SyncData>(`${this.API_URL}/sync`);
      return Result.ok(response.data);
    } catch (error) {
      logger.error('Error downloading changes', { error });
      return Result.fail('Failed to download changes');
    }
  }

  async uploadChanges(studies: Study[]): Promise<Result<void>> {
    try {
      await axios.post(`${this.API_URL}/sync`, { studies, timestamp: new Date() });
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error uploading changes', { error });
      return Result.fail('Failed to upload changes');
    }
  }

  async saveStudies(studies: Study[]): Promise<void> {
    try {
      const url = `${this.API_URL}/studies/bulk`;
      logger.debug('Enviando estudos para o servidor', {
        url,
        count: studies.length,
        firstStudy: studies[0],
        lastStudy: studies[studies.length - 1]
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studies)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      logger.info('Estudos salvos no servidor com sucesso', { count: studies.length });
    } catch (error) {
      logger.error('Erro ao salvar estudos no servidor', error);
      throw error;
    }
  }

  async findDuplicateStudies(studies: Study[]): Promise<Study[]> {
    try {
      const existingStudies = await this.getStudies();
      if (!existingStudies.isSuccessful()) {
        return [];
      }
      
      return studies.filter(study => 
        existingStudies.getValue().some(existing => 
          existing.getDate().getTime() === study.getDate().getTime() && 
          existing.getSubject() === study.getSubject()
        )
      );
    } catch (error) {
      logger.error('Error finding duplicate studies', { error });
      return [];
    }
  }

  async clear(): Promise<void> {
    await this.clearUserData();
  }

  async clearStudies(): Promise<Result<void>> {
    try {
      await this.clearUserData();
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error clearing studies', error);
      return Result.fail(error instanceof Error ? error.message : 'Unknown error clearing studies');
    }
  }

  async getCacheStatus(): Promise<{ size: number; lastUpdated: Date }> {
    const studies = await this.getStudies();
    return {
      size: studies.getValue()?.length || 0,
      lastUpdated: studies.getValue() ? new Date() : new Date(0)
    };
  }

  async bulkUpsertStudies(studies: Study[]): Promise<void> {
    await this.saveStudies(studies);
  }

  async clearUserData(): Promise<void> {
    try {
      const url = `${this.API_URL}/studies`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to clear user data: ${response.statusText}`);
      }

      logger.info('Successfully cleared user data');
    } catch (error) {
      logger.error('Error clearing user data', error);
      throw error;
    }
  }

  async clearSystemData(): Promise<void> {
    try {
      const url = `${this.API_URL}/system`;
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to clear system data: ${response.statusText}`);
      }

      logger.info('Successfully cleared system data');
    } catch (error) {
      logger.error('Error clearing system data', error);
      throw error;
    }
  }

  async getStudyCycles(): Promise<Result<StudyCycle[]>> {
    try {
      const response = await axios.get<StudyCycle[]>(`${this.API_URL}/cycles`);
      return Result.ok(response.data);
    } catch (error) {
      logger.error('Error getting study cycles', { error });
      return Result.fail('Failed to get study cycles');
    }
  }

  async saveStudyCycle(cycle: StudyCycle): Promise<Result<void>> {
    try {
      await axios.post(`${this.API_URL}/cycles`, cycle);
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error saving study cycle', { error });
      return Result.fail('Failed to save study cycle');
    }
  }

  async saveStudyCycles(cycles: StudyCycle[]): Promise<Result<void>> {
    try {
      await axios.post(`${this.API_URL}/cycles/bulk`, cycles);
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error saving study cycles', { error });
      return Result.fail('Failed to save study cycles');
    }
  }

  async clearStudyCycles(): Promise<Result<void>> {
    try {
      await axios.delete(`${this.API_URL}/cycles`);
      return Result.ok(undefined);
    } catch (error) {
      logger.error('Error clearing study cycles', { error });
      return Result.fail('Failed to clear study cycles');
    }
  }

  async invalidateCache(): Promise<Result<void>> {
    // Pode ser só um stub por enquanto
    return Result.ok(undefined);
  }
} 