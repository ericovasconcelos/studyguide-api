"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyRepository = void 0;
const Study_1 = require("../../domain/entities/Study");
const Duration_1 = require("../../domain/value-objects/Duration");
class StudyRepository {
    constructor(storage) {
        this.storage = storage;
    }
    toDomainStudy(dataStudy) {
        const durationResult = Duration_1.Duration.create(dataStudy.timeSpent);
        if (durationResult.failed()) {
            throw new Error(durationResult.getError());
        }
        return Study_1.Study.create({
            id: dataStudy.id || '',
            userId: 'default', // TODO: Get from auth context
            date: new Date(dataStudy.date),
            subject: dataStudy.subject,
            topic: dataStudy.topic || '',
            duration: dataStudy.timeSpent,
            notes: dataStudy.notes || '',
            createdAt: new Date(dataStudy.createdAt),
            updatedAt: new Date(dataStudy.updatedAt)
        }).getValue();
    }
    toDataStudy(domainStudy) {
        return {
            id: domainStudy.getId(),
            date: domainStudy.getDate().toISOString(),
            subject: domainStudy.getSubject(),
            timeSpent: domainStudy.getDuration(),
            topic: domainStudy.getTopic(),
            notes: domainStudy.getNotes(),
            createdAt: domainStudy.getCreatedAt().toISOString(),
            updatedAt: domainStudy.getUpdatedAt().toISOString()
        };
    }
    async save(study) {
        // StorageAdapter interface expects DomainStudy, adapters call .toEntity() internally
        await this.storage.saveStudy(study);
        return study;
    }
    async findById(id) {
        const studiesResult = await this.storage.getStudies();
        if (!studiesResult.isSuccessful()) {
            return null;
        }
        const studies = studiesResult.getValue() || [];
        const foundStudy = studies.find(study => study.getId() === id);
        return foundStudy ? foundStudy : null;
    }
    async findByUserId(userId) {
        const studiesResult = await this.storage.getStudies();
        if (!studiesResult.isSuccessful()) {
            return [];
        }
        const studies = studiesResult.getValue() || [];
        return studies.filter(study => study.getUserId() === userId);
    }
    async findByDateRange(userId, startDate, endDate) {
        const studies = await this.findByUserId(userId);
        return studies.filter(study => {
            const studyDate = study.getDate();
            return studyDate >= startDate && studyDate <= endDate;
        });
    }
    async findAll() {
        const studiesResult = await this.storage.getStudies();
        if (!studiesResult.isSuccessful()) {
            return [];
        }
        return studiesResult.getValue() || [];
    }
    async findAllByUserId(userId) {
        const studiesResult = await this.storage.getStudies();
        if (!studiesResult.isSuccessful()) {
            return [];
        }
        const studies = studiesResult.getValue() || [];
        return studies.filter(study => study.getUserId() === userId);
    }
    async delete(id) {
        const studiesResult = await this.storage.getStudies();
        if (!studiesResult.isSuccessful()) {
            return;
        }
        const studies = studiesResult.getValue() || [];
        const studyToDelete = studies.find(study => study.getId() === id);
        if (studyToDelete) {
            await this.storage.deleteStudy(id);
        }
    }
    async saveMany(studies) {
        for (const study of studies) {
            await this.save(study);
        }
        return studies;
    }
    async deleteByUserId(userId) {
        const studiesResult = await this.storage.getStudies();
        if (!studiesResult.isSuccessful()) {
            return;
        }
        const studies = studiesResult.getValue() || [];
        const studiesWithUserId = studies.filter(study => study.getUserId() === userId);
        for (const study of studiesWithUserId) {
            await this.storage.deleteStudy(study.getId());
        }
    }
    async clear() {
        const result = await this.storage.clearStudies();
        if (result.failed()) {
            throw new Error(result.getError());
        }
    }
}
exports.StudyRepository = StudyRepository;
//# sourceMappingURL=StudyRepository.js.map