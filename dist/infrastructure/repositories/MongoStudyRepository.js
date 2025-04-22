"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoStudyRepository = void 0;
const Study_1 = require("../../domain/entities/Study");
const logger_1 = require("../../utils/logger");
class MongoStudyRepository {
    constructor(client) {
        this.client = client;
        this.context = 'MongoStudyRepository';
        this.collection = client.db().collection('studies');
    }
    async save(study) {
        try {
            const studyData = study.toEntity();
            await this.collection.updateOne({ id: studyData.id }, { $set: studyData }, { upsert: true });
            logger_1.logger.debug(this.context, 'Study saved successfully', { id: studyData.id });
            return study;
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error saving study', { error });
            throw error;
        }
    }
    async saveMany(studies) {
        const session = this.client.startSession();
        try {
            session.startTransaction();
            const savedStudies = await Promise.all(studies.map(study => this.save(study)));
            await session.commitTransaction();
            logger_1.logger.info(this.context, 'Batch save completed', { count: studies.length });
            return savedStudies;
        }
        catch (error) {
            await session.abortTransaction();
            logger_1.logger.error(this.context, 'Error in batch save', { error });
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    async findById(id) {
        try {
            const studyData = await this.collection.findOne({ id });
            if (!studyData)
                return null;
            // Manually create StudyProps from MongoDB data
            const props = {
                id: studyData.id, // Assuming MongoDB doc has 'id' field matching StudyProps
                userId: studyData.userId || 'default', // Provide default or handle missing userId
                date: new Date(studyData.date), // Ensure date is a Date object
                subject: studyData.subject,
                topic: studyData.topic || '',
                duration: studyData.timeSpent, // Assuming MongoDB doc has timeSpent as number
                notes: studyData.notes || '',
                createdAt: new Date(studyData.createdAt),
                updatedAt: new Date(studyData.updatedAt)
            };
            const studyResult = Study_1.Study.create(props);
            if (studyResult.failed()) { // Use failed()
                // Log the specific error and potentially the problematic data
                logger_1.logger.error(this.context, 'Failed to create Study entity from DB data', { id, error: studyResult.getError(), data: studyData });
                // Decide how to handle invalid data from DB - return null or throw?
                return null; // Or throw new Error(...)
            }
            return studyResult.getValue();
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error finding study by id', { id, error });
            throw error;
        }
    }
    async findByUserId(userId) {
        try {
            const studiesData = await this.collection.find({ userId }).toArray();
            const validStudies = [];
            for (const data of studiesData) {
                // Manually create StudyProps from MongoDB data
                const props = {
                    id: data.id,
                    userId: data.userId || 'default',
                    date: new Date(data.date),
                    subject: data.subject,
                    topic: data.topic || '',
                    duration: data.timeSpent,
                    notes: data.notes || '',
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt)
                };
                const studyResult = Study_1.Study.create(props);
                if (studyResult.succeeded()) { // Use succeeded() here
                    validStudies.push(studyResult.getValue());
                }
                else {
                    logger_1.logger.warn(this.context, 'Skipping invalid study data from DB in findByUserId', { userId, error: studyResult.getError(), data });
                }
            }
            return validStudies;
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error finding studies by user id', { userId, error });
            throw error; // Re-throw or return empty array?
        }
    }
    async findByDateRange(userId, startDate, endDate) {
        try {
            const studiesData = await this.collection.find({
                userId,
                date: { $gte: startDate, $lte: endDate }
            }).toArray();
            const validStudies = [];
            for (const data of studiesData) {
                const props = {
                    id: data.id,
                    userId: data.userId || 'default',
                    date: new Date(data.date),
                    subject: data.subject,
                    topic: data.topic || '',
                    duration: data.timeSpent,
                    notes: data.notes || '',
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt)
                };
                const studyResult = Study_1.Study.create(props);
                if (studyResult.succeeded()) { // Use succeeded()
                    validStudies.push(studyResult.getValue());
                }
                else {
                    logger_1.logger.warn(this.context, 'Skipping invalid study data from DB in findByDateRange', { userId, error: studyResult.getError(), data });
                }
            }
            return validStudies;
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error finding studies by date range', { userId, startDate, endDate, error });
            throw error;
        }
    }
    async delete(id) {
        try {
            await this.collection.deleteOne({ id });
            logger_1.logger.debug(this.context, 'Study deleted successfully', { id });
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error deleting study', { id, error });
            throw error;
        }
    }
    async deleteByUserId(userId) {
        try {
            await this.collection.deleteMany({ userId });
            logger_1.logger.debug(this.context, 'Studies deleted successfully', { userId });
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error deleting studies by user id', { userId, error });
            throw error;
        }
    }
    async findAll() {
        try {
            const studiesData = await this.collection.find().toArray();
            const validStudies = [];
            for (const data of studiesData) {
                const props = {
                    id: data.id,
                    userId: data.userId || 'default',
                    date: new Date(data.date),
                    subject: data.subject,
                    topic: data.topic || '',
                    duration: data.timeSpent,
                    notes: data.notes || '',
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt)
                };
                const studyResult = Study_1.Study.create(props);
                if (studyResult.succeeded()) { // Use succeeded()
                    validStudies.push(studyResult.getValue());
                }
                else {
                    logger_1.logger.warn(this.context, 'Skipping invalid study data from DB in findAll', { error: studyResult.getError(), data });
                }
            }
            return validStudies;
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error finding all studies', { error });
            throw error;
        }
    }
    async clear() {
        try {
            await this.collection.deleteMany({});
            logger_1.logger.debug(this.context, 'All studies deleted successfully');
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Error clearing studies', { error });
            throw error;
        }
    }
}
exports.MongoStudyRepository = MongoStudyRepository;
//# sourceMappingURL=MongoStudyRepository.js.map