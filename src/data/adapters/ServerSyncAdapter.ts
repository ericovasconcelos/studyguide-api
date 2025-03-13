import axios from 'axios';
import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface SyncAdapter {
  uploadChanges(changes: { studies: Study[]; cycles: StudyCycle[] }): Promise<{ timestamp: Date }>;
  downloadChanges(since: Date): Promise<{ studies: Study[]; cycles: StudyCycle[]; timestamp: Date }>;
}

export class ServerSyncAdapter implements SyncAdapter {
  private userId: string;
  private lastSyncTimestamp: Date | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  async uploadChanges(changes: { studies: Study[]; cycles: StudyCycle[] }): Promise<{ timestamp: Date }> {
    try {
      const response = await axios.post(`${API_URL}/sync/upload`, changes, {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': this.userId
        }
      });

      this.lastSyncTimestamp = new Date(response.data.timestamp);
      return { timestamp: this.lastSyncTimestamp };
    } catch (error) {
      console.error('Failed to upload changes:', error);
      throw new Error('Sync failed: Could not upload changes');
    }
  }

  async downloadChanges(since: Date): Promise<{ studies: Study[]; cycles: StudyCycle[]; timestamp: Date }> {
    try {
      const response = await axios.get(`${API_URL}/sync/download`, {
        params: { since: since.toISOString() },
        headers: {
          'X-User-Id': this.userId
        }
      });

      this.lastSyncTimestamp = new Date(response.data.timestamp);
      return {
        studies: response.data.studies,
        cycles: response.data.cycles,
        timestamp: this.lastSyncTimestamp
      };
    } catch (error) {
      console.error('Failed to download changes:', error);
      throw new Error('Sync failed: Could not download changes');
    }
  }

  getLastSyncTimestamp(): Date | null {
    return this.lastSyncTimestamp;
  }
} 