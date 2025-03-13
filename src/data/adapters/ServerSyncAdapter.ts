import { StorageAdapter } from './StorageAdapter';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';
import { config } from '../../config/env';
import { IndexedDBAdapter } from './IndexedDBAdapter';

export class ServerSyncAdapter {
  private lastSyncTimestamp: Date | null = null;
  private readonly storage: StorageAdapter;

  constructor(
    userIdOrStorage: string | StorageAdapter,
    userId?: string
  ) {
    if (typeof userIdOrStorage === 'string') {
      this.storage = new IndexedDBAdapter();
      this.userId = userIdOrStorage;
    } else {
      this.storage = userIdOrStorage;
      this.userId = userId!;
    }
  }

  private readonly userId: string;

  getLastSyncTimestamp(): Date | null {
    return this.lastSyncTimestamp;
  }

  async uploadChanges(data: { studies: Study[]; cycles: StudyCycle[] }): Promise<{ timestamp: Date }> {
    try {
      const response = await fetch(`${config.api.baseUrl}/sync/${this.userId}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.lastSyncTimestamp = new Date(result.timestamp);
      return { timestamp: new Date(result.timestamp) };
    } catch (error) {
      console.error('Error uploading changes:', error);
      throw error;
    }
  }

  async downloadChanges(since: Date): Promise<{ studies: Study[]; cycles: StudyCycle[]; timestamp: Date }> {
    try {
      const response = await fetch(
        `${config.api.baseUrl}/sync/${this.userId}/download?since=${since.toISOString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.lastSyncTimestamp = new Date(result.timestamp);
      return {
        studies: result.studies,
        cycles: result.cycles,
        timestamp: new Date(result.timestamp),
      };
    } catch (error) {
      console.error('Error downloading changes:', error);
      throw error;
    }
  }
} 