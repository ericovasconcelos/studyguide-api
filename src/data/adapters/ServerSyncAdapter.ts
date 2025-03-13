import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import { API_URL } from '../config/env';

interface SyncData {
  studies: Study[];
  cycles: StudyCycle[];
}

interface SyncResponse {
  timestamp: Date;
  studies: Study[];
  cycles: StudyCycle[];
}

export class ServerSyncAdapter {
  private primaryStorage: IndexedDBAdapter;
  private userId: string;
  private apiUrl: string;
  private lastSyncTimestamp: Date | null = null;

  constructor(primaryStorage: IndexedDBAdapter, userId: string, apiUrl: string = API_URL) {
    this.primaryStorage = primaryStorage;
    this.userId = userId;
    this.apiUrl = apiUrl;
  }

  getLastSyncTimestamp(): Date | null {
    return this.lastSyncTimestamp;
  }

  async uploadChanges(data: SyncData): Promise<{ timestamp: Date }> {
    try {
      const response = await fetch(`${this.apiUrl}/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          ...data
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload changes');
      }

      const result = await response.json();
      this.lastSyncTimestamp = new Date(result.timestamp);
      return { timestamp: this.lastSyncTimestamp };
    } catch (error) {
      console.error('Error uploading changes:', error);
      throw error;
    }
  }

  async downloadChanges(since: Date): Promise<SyncResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/sync/download?since=${since.toISOString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download changes');
      }

      const result = await response.json();
      this.lastSyncTimestamp = new Date(result.timestamp);
      return {
        timestamp: this.lastSyncTimestamp,
        studies: result.studies || [],
        cycles: result.cycles || []
      };
    } catch (error) {
      console.error('Error downloading changes:', error);
      throw error;
    }
  }
} 