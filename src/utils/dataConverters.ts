import { Study } from '../domain/entities/Study';

export const toStudyEntity = (data: any): Study => {
  return Study.fromEntity({
    id: data.id,
    userId: data.userId,
    date: new Date(data.date),
    subject: data.subject,
    topic: data.topic,
    duration: data.duration,
    notes: data.notes,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt)
  }).getValue();
};

export const fromStudyEntity = (study: Study): any => {
  return study.toEntity();
}; 