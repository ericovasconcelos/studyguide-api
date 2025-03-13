export interface Study {
  id?: string;
  date: string;
  subject: string;
  timeSpent: number;
  questions?: number;
  correctAnswers?: number;
  topic?: string;
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
} 