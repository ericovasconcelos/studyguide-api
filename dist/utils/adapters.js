"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDashboardStudy = void 0;
const toDashboardStudy = (study) => ({
    id: study.getId(),
    subject: study.getSubject(),
    topic: study.getTopic(),
    timeSpent: study.getDuration(),
    date: study.getDate().toISOString(),
    notes: study.getNotes(),
    createdAt: study.getCreatedAt().toISOString(),
    updatedAt: study.getUpdatedAt().toISOString(),
});
exports.toDashboardStudy = toDashboardStudy;
//# sourceMappingURL=adapters.js.map