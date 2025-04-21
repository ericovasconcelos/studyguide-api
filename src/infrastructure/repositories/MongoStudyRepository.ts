import { MongoClient, Collection } from 'mongodb';
import { IStudyRepository } from '../../domain/repositories/IStudyRepository';
import { Study, StudyProps } from '../../domain/entities/Study';
import { logger } from '../../utils/logger';

export class MongoStudyRepository implements IStudyRepository {
  private collection: Collection;
  private readonly context = 'MongoStudyRepository';

  constructor(private client: MongoClient) {
    this.collection = client.db().collection('studies');
  }

  async save(study: Study): Promise<Study> {
    try {
      const studyData = study.toEntity();
      await this.collection.updateOne(
        { id: studyData.id },
        { $set: studyData },
        { upsert: true }
      );
      logger.debug(this.context, 'Study saved successfully', { id: studyData.id });
      return study;
    } catch (error) {
      logger.error(this.context, 'Error saving study', { error });
      throw error;
    }
  }

  async saveMany(studies: Study[]): Promise<Study[]> {
    const session = this.client.startSession();
    try {
      session.startTransaction();
      
      const savedStudies = await Promise.all(
        studies.map(study => this.save(study))
      );
      
      await session.commitTransaction();
      logger.info(this.context, 'Batch save completed', { count: studies.length });
      return savedStudies;
    } catch (error) {
      await session.abortTransaction();
      logger.error(this.context, 'Error in batch save', { error });
      throw error;
    } finally {
      session.endSession();
    }
  }

  async findById(id: string): Promise<Study | null> {
    try {
      const studyData = await this.collection.findOne({ id });
      if (!studyData) return null;
      
      const studyResult = Study.create(studyData as StudyProps);
      if (studyResult.isFailure()) {
        throw new Error(studyResult.getError());
      }
      
      return studyResult.getValue();
    } catch (error) {
      logger.error(this.context, 'Error finding study by id', { id, error });
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Study[]> {
    try {
      const studiesData = await this.collection.find({ userId }).toArray();
      return studiesData.map(data => {
        const studyResult = Study.create(data as StudyProps);
        if (studyResult.isFailure()) {
          throw new Error(studyResult.getError());
        }
        return studyResult.getValue();
      });
    } catch (error) {
      logger.error(this.context, 'Error finding studies by user id', { userId, error });
      throw error;
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Study[]> {
    try {
      const studiesData = await this.collection.find({
        userId,
        date: {
          $gte: startDate,
          $lte: endDate
        }
      }).toArray();
      
      return studiesData.map(data => {
        const studyResult = Study.create(data as StudyProps);
        if (studyResult.isFailure()) {
          throw new Error(studyResult.getError());
        }
        return studyResult.getValue();
      });
    } catch (error) {
      logger.error(this.context, 'Error finding studies by date range', { 
        userId, 
        startDate, 
        endDate, 
        error 
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.collection.deleteOne({ id });
      logger.debug(this.context, 'Study deleted successfully', { id });
    } catch (error) {
      logger.error(this.context, 'Error deleting study', { id, error });
      throw error;
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await this.collection.deleteMany({ userId });
      logger.debug(this.context, 'Studies deleted successfully', { userId });
    } catch (error) {
      logger.error(this.context, 'Error deleting studies by user id', { userId, error });
      throw error;
    }
  }

  async findAll(): Promise<Study[]> {
    try {
      const studiesData = await this.collection.find().toArray();
      return studiesData.map(data => {
        const studyResult = Study.create(data as StudyProps);
        if (studyResult.isFailure()) {
          throw new Error(studyResult.getError());
        }
        return studyResult.getValue();
      });
    } catch (error) {
      logger.error(this.context, 'Error finding all studies', { error });
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.collection.deleteMany({});
      logger.debug(this.context, 'All studies deleted successfully');
    } catch (error) {
      logger.error(this.context, 'Error clearing studies', { error });
      throw error;
    }
  }
} 