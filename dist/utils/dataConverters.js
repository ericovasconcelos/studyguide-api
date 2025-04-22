"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromStudyEntity = exports.toStudyEntity = void 0;
const Study_1 = require("../domain/entities/Study");
const toStudyEntity = (data) => {
    return Study_1.Study.fromEntity({
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
exports.toStudyEntity = toStudyEntity;
const fromStudyEntity = (study) => {
    return study.toEntity();
};
exports.fromStudyEntity = fromStudyEntity;
//# sourceMappingURL=dataConverters.js.map