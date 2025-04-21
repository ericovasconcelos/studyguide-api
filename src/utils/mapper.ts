// src/utils/mapper.ts


export const toDashboardStudy = (study: DomainStudy): DashboardStudy => ({
    id: study.getId(),
    subject: study.getSubject(),
    topic: study.getTopic(),
    timeSpent: study.getDuration().getMinutes(), // ou `study.duration` se já for número
    // ...outros campos necessários
  });
  