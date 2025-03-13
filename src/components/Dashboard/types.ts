import { ReactNode } from 'react';

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
  cycleId?: string | number;
  round?: number;
}

export interface StudyCycle {
  id?: string | number;
  name?: string;
  startDate?: string;
  endDate?: string;
  targetHours?: number;
  subjects?: string[];
}

export interface SubjectMetrics {
  timeSpent: number;
  questions: number;
  correctAnswers: number;
  accuracy: number;
}

export interface StudyMetrics {
  totalTimeInMinutes: number;
  totalQuestions: number;
  totalCorrect: number;
  avgTimePerDay: number;
  studyDays: number;
  currentStreak: number;
  subjectPerformance: {
    [key: string]: SubjectMetrics;
  };
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  iconColor: string;
  tooltip: string;
}

export interface DashboardFiltersProps {
  subjects: string[];
  selectedSubject: string;
  onSubjectChange: (subject: string) => void;
  dateRange: [any, any] | null;
  onDateRangeChange: (dates: [any, any] | null) => void;
  studyCycles?: StudyCycle[];
  selectedCycleId?: string | number;
  onCycleChange?: (cycleId: string | number) => void;
  rounds?: number[];
  selectedRound?: number;
  onRoundChange?: (round: number) => void;
}

export type AntdIconType = ReactNode; 