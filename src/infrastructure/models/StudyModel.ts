import mongoose, { Document } from 'mongoose';
import { StudyEntity, Study } from '../../domain/entities/Study';
import { Duration } from '../../domain/value-objects/Duration';

interface IStudyDocument extends Document {
  userId: string;
  date: Date;
  subject: string;
  topic: string;
  duration: number; // Store as number in MongoDB
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  toDomain(): Study;
}

const studySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: Date, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  duration: { type: Number, required: true }, // Store as number
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add toDomain method to convert MongoDB document to domain entity
studySchema.methods.toDomain = function(this: IStudyDocument) {
  const durationResult = Duration.create(this.duration);
  if (durationResult.isFailure()) {
    throw new Error(durationResult.getError());
  }

  const props: StudyEntity = {
    id: this._id.toString(),
    userId: this.userId,
    date: this.date,
    subject: this.subject,
    topic: this.topic,
    duration: durationResult.getValue(),
    notes: this.notes,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
  
  const result = Study.create(props);
  if (result.failed()) {
    throw new Error(result.getError());
  }
  
  return result.getValue();
};

export const StudyModel = mongoose.model<IStudyDocument>('Study', studySchema); 