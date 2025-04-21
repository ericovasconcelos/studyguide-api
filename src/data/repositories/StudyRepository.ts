import { Study as DomainStudy } from '../../domain/entities/Study';
import { StorageAdapter } from '../adapters/StorageAdapter';
import { IStudyRepository } from '../../domain/repositories/IStudyRepository';
import { Study as DataStudy } from '../models/Study';
import { Duration } from '../../domain/value-objects/Duration';
import { StudyModel } from '../../infrastructure/models/StudyModel';
import { Document } from 'mongoose';

export class StudyRepository implements IStudyRepository {
  constructor(private storage: StorageAdapter) {}

  private toDomainStudy(dataStudy: DataStudy): DomainStudy {
    const durationResult = Duration.create(dataStudy.timeSpent);
    if (durationResult.isFailure()) {
      throw new Error(durationResult.getError());
    }

    return DomainStudy.create({
      id: dataStudy.id || '',
      userId: 'default', // TODO: Get from auth context
      date: new Date(dataStudy.date),
      subject: dataStudy.subject,
      topic: dataStudy.topic || '',
      duration: durationResult.getValue(),
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
    const dataStudy = this.toDataStudy(study);
    await this.storage.saveStudy(dataStudy);
    return study;
  }

  async findById(id: string): Promise<DomainStudy | null> {
    const studies = await this.storage.getStudies();
    const dataStudy = studies.find(study => study.id === id);
    return dataStudy ? this.toDomainStudy(dataStudy) : null;
  }

  async findByUserId(userId: string): Promise<DomainStudy[]> {
    const studies = await this.storage.getStudies();
    return studies
      .map(study => this.toDomainStudy(study))
      .filter(study => study.getUserId() === userId);
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<DomainStudy[]> {
    const studies = await this.findByUserId(userId);
    return studies.filter(study => {
      const studyDate = study.getDate();
      return studyDate >= startDate && studyDate <= endDate;
    });
  }

  async delete(id: string): Promise<void> {
    const studies = await this.storage.getStudies();
    const updatedStudies = studies.filter(study => study.id !== id);
    await this.storage.saveStudies(updatedStudies);
  }

  async saveMany(studies: DomainStudy[]): Promise<DomainStudy[]> {
    const dataStudies = studies.map(study => this.toDataStudy(study));
    await this.storage.saveStudies(dataStudies);
    return studies;
  }

  async deleteByUserId(userId: string): Promise<void> {
    const studies = await this.storage.getStudies();
    const domainStudies = studies.map(study => this.toDomainStudy(study));
    const studiesToKeep = domainStudies.filter(study => study.getUserId() !== userId);
    const dataStudiesToKeep = studiesToKeep.map(study => this.toDataStudy(study));
    await this.storage.saveStudies(dataStudiesToKeep);
  }

  async clear(): Promise<void> {
    await this.storage.clearStudies();
  }
} 