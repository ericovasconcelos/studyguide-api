import { Study } from '../models/Study';
import { IndexedDBAdapter } from '../adapters/IndexedDBAdapter';

export interface StudyService {
  getStudies(): Promise<Study[]>;
  getAdapter(): IndexedDBAdapter;
  importGranRecords(records: Study[]): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
    details: string[];
  }>;
}

export class StudyServiceImpl implements StudyService {
  private adapter: IndexedDBAdapter;

  constructor(adapter: IndexedDBAdapter) {
    this.adapter = adapter;
  }

  getAdapter(): IndexedDBAdapter {
    return this.adapter;
  }

  async getStudies(): Promise<Study[]> {
    return this.adapter.getStudies();
  }

  async importGranRecords(records: Study[]): Promise<{
    imported: number;
    duplicates: number;
    errors: number;
    details: string[];
  }> {
    const result = await this.adapter.saveStudies(records);
    return {
      imported: records.length,
      duplicates: 0,
      errors: 0,
      details: ['Importação concluída com sucesso']
    };
  }
} 