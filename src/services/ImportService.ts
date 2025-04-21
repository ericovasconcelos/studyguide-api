import { Study } from '../data/models/Study';
import { StudyRepository } from '../data/repositories/StudyRepository';

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

  private convertGranRecord(granRecord: GranStudyRecord): Study {
    // Log para debug
    console.log('[DEBUG] Convertendo registro:', JSON.stringify(granRecord, null, 2));

    // Validar se o registro existe e tem os campos obrigatórios
    if (!granRecord || !granRecord.subject || !granRecord.date) {
      throw new Error(`Registro inválido: campos obrigatórios faltando - 
        Disciplina: ${granRecord?.subject || 'ausente'}, 
        Data: ${granRecord?.date || 'ausente'}`);
    }

    // Converter studyTime de string "HH:mm" para minutos
    let timeSpentMinutes = 0;
    if (granRecord.studyTime && typeof granRecord.studyTime === 'string') {
      try {
        const [hours, minutes] = granRecord.studyTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          timeSpentMinutes = (hours * 60) + minutes;
        } else {
          console.warn('[DEBUG] Tempo inválido:', granRecord.studyTime);
        }
      } catch (error) {
        console.warn('[DEBUG] Erro ao converter tempo:', granRecord.studyTime, error);
      }
    }

    // Garantir que temos um ID único e válido
    const id = granRecord.id ? String(granRecord.id) : `gran-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Formatar a data para o formato ISO
    let date;
    try {
      const parsedDate = new Date(granRecord.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Data inválida');
      }
      date = parsedDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('[DEBUG] Erro ao converter data:', granRecord.date);
      throw new Error(`Data inválida: ${granRecord.date}`);
    }

    // Criar o objeto Study com valores validados
    const study: Study = {
      id, 
      date,
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

    // Log do objeto convertido
    console.log('[DEBUG] Registro convertido:', JSON.stringify(study, null, 2));

    return study;
  }

  private async checkDuplicate(record: Study): Promise<boolean> {
    const existingRecords = await this.studyRepository.getStudies();
    return existingRecords.some((existing: Study) => {
      // Verifica se é o mesmo registro do Gran (pelo ID)
      if (existing.id === record.id) {
        return true;
      }

      // Verifica se é o mesmo estudo comparando todos os campos relevantes
      const sameDate = existing.date === record.date;
      const sameSubject = existing.subject === record.subject;
      const sameTimeSpent = existing.timeSpent === record.timeSpent;
      const sameQuestions = existing.questions === record.questions;
      const sameCorrectAnswers = existing.correctAnswers === record.correctAnswers;

      return sameDate && sameSubject && sameTimeSpent && sameQuestions && sameCorrectAnswers;
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
        // Converter o registro do Gran para o formato da aplicação
        const study = this.convertGranRecord(granRecord);

        // Verificar se já existe um registro igual
        const isDuplicate = await this.checkDuplicate(study);
        if (isDuplicate) {
          result.duplicates++;
          result.details.push(`Registro duplicado ignorado: ${study.id} - ${study.date} - ${study.subject}`);
          continue;
        }

        // Salvar o registro
        await this.studyRepository.saveStudy(study);
        result.imported++;
        result.details.push(`Registro importado: ${study.id} - ${study.date} - ${study.subject}`);
      } catch (error) {
        result.errors++;
        result.details.push(`Erro ao importar registro: ${error.message}`);
        console.error('[DEBUG] Erro ao importar registro:', error);
      }
    }

    return result;
  }
} 