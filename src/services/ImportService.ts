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
    console.log('Convertendo registro:', JSON.stringify(granRecord, null, 2));

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
          console.warn('Tempo inválido:', granRecord.studyTime);
        }
      } catch (error) {
        console.warn('Erro ao converter tempo:', granRecord.studyTime, error);
      }
    }

    // Formatar a data para o formato ISO
    let date;
    try {
      const parsedDate = new Date(granRecord.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Data inválida');
      }
      date = parsedDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Erro ao converter data:', granRecord.date);
      throw new Error(`Data inválida: ${granRecord.date}`);
    }

    // Criar o objeto Study com valores validados
    const study: Study = {
      id: granRecord.id.toString(),
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
    console.log('Registro convertido:', JSON.stringify(study, null, 2));

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

      // Considera duplicado apenas se TODOS os campos principais forem iguais
      return sameDate && 
             sameSubject && 
             sameTimeSpent && 
             sameQuestions && 
             sameCorrectAnswers;
    });
  }

  async importGranRecords(granRecords: GranStudyRecord[]): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      duplicates: 0,
      errors: 0,
      details: []
    };

    if (!Array.isArray(granRecords)) {
      result.errors++;
      result.details.push('Dados inválidos recebidos do Gran');
      console.error('Dados recebidos não são um array:', granRecords);
      return result;
    }

    // Log para debug
    console.log('Registros recebidos do Gran:', JSON.stringify(granRecords, null, 2));

    for (const granRecord of granRecords) {
      try {
        // Log para debug do registro atual
        console.log('Processando registro:', JSON.stringify(granRecord, null, 2));

        // Validação mais detalhada
        if (!granRecord) {
          result.errors++;
          result.details.push('Registro inválido: registro vazio');
          continue;
        }

        // Validar campos obrigatórios
        if (!granRecord.subject || !granRecord.date) {
          console.warn('Registro com campos obrigatórios faltando:', {
            temDisciplina: !!granRecord.subject,
            temData: !!granRecord.date,
            registro: granRecord
          });
          result.errors++;
          result.details.push(`Registro inválido: campos obrigatórios faltando - Disciplina: ${granRecord.subject || 'ausente'}, Data: ${granRecord.date || 'ausente'}`);
          continue;
        }

        const study = this.convertGranRecord(granRecord);
        
        // Verificar duplicatas
        const isDuplicate = await this.checkDuplicate(study);
        if (isDuplicate) {
          result.duplicates++;
          result.details.push(`Registro duplicado: ${study.subject} em ${new Date(study.date).toLocaleDateString()}`);
          continue;
        }

        // Salvar o registro
        await this.studyRepository.saveStudy(study);
        result.imported++;
        result.details.push(`Importado com sucesso: ${study.subject} em ${new Date(study.date).toLocaleDateString()}`);

      } catch (error) {
        result.errors++;
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        const disciplina = granRecord?.subject || 'Registro desconhecido';
        result.details.push(`Erro ao importar ${disciplina}: ${errorMessage}`);
        console.error('Erro ao processar registro:', {
          error,
          granRecord: JSON.stringify(granRecord, null, 2)
        });
      }
    }

    // Log do resultado final
    console.log('Resultado da importação:', result);

    return result;
  }
} 