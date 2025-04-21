import { Study as DomainStudy } from '../../domain/entities/Study';
import { StorageAdapter } from '../../domain/interfaces/StorageAdapter';
import { IStudyRepository } from '../../domain/repositories/IStudyRepository';
import { Study as DataStudy } from '../models/Study';
import { Duration } from '../../domain/value-objects/Duration';


export class StudyRepository implements IStudyRepository {
  constructor(private storage: StorageAdapter) {}

  private toDomainStudy(dataStudy: DataStudy): DomainStudy {
    const durationResult = Duration.create(dataStudy.timeSpent);
    if (durationResult.failed()) {
      throw new Error(durationResult.getError());
    }

    return DomainStudy.create({
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

  private toDataStudy(domainStudy: DomainStudy): DataStudy {
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

  async save(study: DomainStudy): Promise<DomainStudy> {
    // StorageAdapter interface expects DomainStudy, adapters call .toEntity() internally
    await this.storage.saveStudy(study); 
    return study;
  }

  async findById(id: string): Promise<DomainStudy | null> {
    const studiesResult = await this.storage.getStudies();
    if (!studiesResult.isSuccessful()) {
      return null;
    }
    const studies = studiesResult.getValue() || [];
    const foundStudy = studies.find(study => study.getId() === id);
    return foundStudy ? foundStudy : null;
  }

  async findByUserId(userId: string): Promise<DomainStudy[]> {
    const studiesResult = await this.storage.getStudies();
    if (!studiesResult.isSuccessful()) {
      return [];
    }
    const studies = studiesResult.getValue() || [];
    return studies.filter(study => study.getUserId() === userId);
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DomainStudy[]> {
    const studies = await this.findByUserId(userId);
    return studies.filter(study => {
      const studyDate = study.getDate();
      return studyDate >= startDate && studyDate <= endDate;
    });
  }

  async findAll(): Promise<DomainStudy[]> {
    const studiesResult = await this.storage.getStudies();
    if (!studiesResult.isSuccessful()) {
      return [];
    }
    return studiesResult.getValue() || [];
  } 

  async findAllByUserId(userId: string): Promise<DomainStudy[]> {
    const studiesResult = await this.storage.getStudies();
    if (!studiesResult.isSuccessful()) {
      return [];
    }
    const studies = studiesResult.getValue() || [];
    return studies.filter(study => study.getUserId() === userId);
  } 

  async delete(id: string): Promise<void> {
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

  async saveMany(studies: DomainStudy[]): Promise<DomainStudy[]> {
    for (const study of studies) {
      await this.save(study);
    }
    return studies;
  }

  async deleteByUserId(userId: string): Promise<void> {
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

  async clear(): Promise<void> {
    await this.storage.clearStudies();
  }
} 