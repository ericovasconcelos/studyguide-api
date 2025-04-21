// src/utils/adapters.ts
import { Study as DomainStudy } from '../domain/entities/Study';

export const toDashboardStudy = (study: DomainStudy) => ({
  id: study.getId(),
  subject: study.getSubject(),
  topic: study.getTopic(),
  timeSpent: study.getDuration(),
  date: study.getDate().toISOString(),
  notes: study.getNotes(),
  createdAt: study.getCreatedAt().toISOString(),
  updatedAt: study.getUpdatedAt().toISOString(),
});
