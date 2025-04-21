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
      
      // Manually create StudyProps from MongoDB data
      const props: StudyProps = {
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

      const studyResult = Study.create(props);
      if (studyResult.failed()) { // Use failed()
        // Log the specific error and potentially the problematic data
        logger.error(this.context, 'Failed to create Study entity from DB data', { id, error: studyResult.getError(), data: studyData });
        // Decide how to handle invalid data from DB - return null or throw?
        return null; // Or throw new Error(...)
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
      const validStudies: Study[] = [];
      for (const data of studiesData) {
          // Manually create StudyProps from MongoDB data
          const props: StudyProps = {
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
          const studyResult = Study.create(props);
          if (studyResult.succeeded()) { // Use succeeded() here
              validStudies.push(studyResult.getValue());
          } else {
              logger.warn(this.context, 'Skipping invalid study data from DB in findByUserId', { userId, error: studyResult.getError(), data });
          }
      }
      return validStudies;
    } catch (error) {
      logger.error(this.context, 'Error finding studies by user id', { userId, error });
      throw error; // Re-throw or return empty array?
    }
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Study[]> {
    try {
      const studiesData = await this.collection.find({
        userId,
        date: { $gte: startDate, $lte: endDate }
      }).toArray();
      
      const validStudies: Study[] = [];
      for (const data of studiesData) {
          const props: StudyProps = {
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
          const studyResult = Study.create(props);
          if (studyResult.succeeded()) { // Use succeeded()
              validStudies.push(studyResult.getValue());
          } else {
              logger.warn(this.context, 'Skipping invalid study data from DB in findByDateRange', { userId, error: studyResult.getError(), data });
          }
      }
      return validStudies;
    } catch (error) {
      logger.error(this.context, 'Error finding studies by date range', { userId, startDate, endDate, error });
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
      const validStudies: Study[] = [];
      for (const data of studiesData) {
          const props: StudyProps = {
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
          const studyResult = Study.create(props);
          if (studyResult.succeeded()) { // Use succeeded()
              validStudies.push(studyResult.getValue());
          } else {
              logger.warn(this.context, 'Skipping invalid study data from DB in findAll', { error: studyResult.getError(), data });
          }
      }
      return validStudies;
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