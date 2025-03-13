import { Study } from '../data/models/Study';

interface LegacyStudy {
  id?: string;
  date: Date | string;
  subject: string;
  studyTime: string;
  totalExercises: number;
  correctAnswers: number;
  studyType: string;
  studyPeriod: string;
  cycle?: string;
  cycleId?: number;
  version?: number;
}

/**
 * Converte o tempo no formato "HH:MM" para minutos
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  } catch (error) {
    console.error('Erro ao converter tempo:', error);
    return 0;
  }
}

/**
 * Converte um registro de estudo do formato antigo para o novo
 */
export function convertLegacyStudy(legacy: LegacyStudy): Study {
  return {
    id: legacy.id,
    date: typeof legacy.date === 'string' ? legacy.date : legacy.date.toISOString(),
    subject: legacy.subject,
    timeSpent: timeStringToMinutes(legacy.studyTime),
    questions: legacy.totalExercises,
    correctAnswers: legacy.correctAnswers,
    source: legacy.studyType,
    topic: legacy.studyPeriod, // Usando o período como tópico inicialmente
    notes: '', // Campo novo, inicializado vazio
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Converte um array de registros do formato antigo para o novo
 */
export function convertLegacyStudies(legacyStudies: LegacyStudy[]): Study[] {
  return legacyStudies.map(convertLegacyStudy);
} 