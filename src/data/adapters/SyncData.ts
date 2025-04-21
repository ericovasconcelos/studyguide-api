import { Study } from '../models/Study';
import { StudyCycle } from '../models/StudyCycle';

export interface SyncData {
  studies: Study[];
  cycles: StudyCycle[];
  timestamp: Date;
} 