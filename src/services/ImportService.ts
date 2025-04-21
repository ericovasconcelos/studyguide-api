import { Study } from '../domain/entities/Study';
import { StudyRepository } from '../data/repositories/StudyRepository';
import { logger } from '../utils/logger';

interface GranStudyRecord {
  id: string | number;
  date: string;
  subject: string;
  studyTime: string;
  totalExercises: number;
  correctAnswers: number;
  studyType: string;
  studyPeriod: string;
  cycle: string;
  cycleId: number;
  version: number;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: number;
  details: string[];
}

export class ImportService {
  constructor(private studyRepository: StudyRepository) {}

  private convertGranRecord(granRecord: GranStudyRecord): any {
    let timeSpentMinutes = 0;
    if (granRecord.studyTime && typeof granRecord.studyTime === 'string') {
      try {
        const [hours, minutes] = granRecord.studyTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          timeSpentMinutes = (hours * 60) + minutes;
        }
      } catch { /* ignore */ }
    }
    let dateStr = '';
    try {
      const parsedDate = new Date(granRecord.date);
      if (!isNaN(parsedDate.getTime())) {
         dateStr = parsedDate.toISOString().split('T')[0];
      }
    } catch { /* ignore */ }
    const id = granRecord.id ? String(granRecord.id) : `gran-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    return {
      id, 
      date: dateStr,
      subject: granRecord.subject,
      timeSpent: timeSpentMinutes,
      questions: typeof granRecord.totalExercises === 'number' ? granRecord.totalExercises : 0,
      correctAnswers: typeof granRecord.correctAnswers === 'number' ? granRecord.correctAnswers : 0,
      topic: granRecord.cycle || '',
      notes: granRecord.studyPeriod ? `Período: ${granRecord.studyPeriod}` : '',
      source: 'Gran Cursos',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private async checkDuplicate(record: Study): Promise<boolean> {
    const existingRecords: Study[] = await this.studyRepository.findAll();

    return existingRecords.some((existing: Study) => {
      if (existing.getId() === record.getId()) {
        return true;
      }

      const sameDate = existing.getDate().toISOString().split('T')[0] === record.getDate().toISOString().split('T')[0];
      const sameSubject = existing.getSubject() === record.getSubject();
      const sameTimeSpent = existing.getDuration() === record.getDuration();

      return sameDate && sameSubject && sameTimeSpent;
    });
  }

  async importGranRecords(granRecords: GranStudyRecord[]): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: []
    };

    for (const granRecord of granRecords) {
      try {
        let timeSpentMinutes = 0;
        if (granRecord.studyTime && typeof granRecord.studyTime === 'string') {
            try { const [h, m] = granRecord.studyTime.split(':').map(Number); if (!isNaN(h) && !isNaN(m)) timeSpentMinutes = h * 60 + m; } catch {} 
        }
        let dateObj: Date;
        try { dateObj = new Date(granRecord.date); if (isNaN(dateObj.getTime())) throw new Error(); } catch { throw new Error(`Invalid date: ${granRecord.date}`); }

        const studyProps = {
            id: granRecord.id ? String(granRecord.id) : `gran-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            userId: 'default',
            date: dateObj,
            subject: granRecord.subject,
            topic: granRecord.cycle || '',
            duration: timeSpentMinutes,
            notes: granRecord.studyPeriod ? `Period: ${granRecord.studyPeriod}` : '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const studyResult = Study.create(studyProps);
        if (studyResult.failed()) {
          throw new Error(`Validation failed: ${studyResult.getError()}`);
        }
        const study: Study = studyResult.getValue();

        const isDuplicate = await this.checkDuplicate(study);
        if (isDuplicate) {
          result.duplicates++;
          result.details.push(`Duplicate ignored: ${study.getId()} - ${study.getDate().toISOString().split('T')[0]} - ${study.getSubject()}`);
          continue;
        }

        await this.studyRepository.save(study);
        result.imported++;
        result.details.push(`Imported: ${study.getId()} - ${study.getDate().toISOString().split('T')[0]} - ${study.getSubject()}`);

      } catch (error: unknown) {
        result.errors++;
        const msg = error instanceof Error ? error.message : String(error);
        result.details.push(`Error importing (ID: ${granRecord.id || 'N/A'}): ${msg}`);
        logger.error(`Error importing (ID: ${granRecord.id || 'N/A'}):`, error);
      }
    }

    return result;
  }
} 