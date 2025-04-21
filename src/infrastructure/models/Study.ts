import mongoose, { Schema, Document } from 'mongoose';

export interface IStudy extends Document {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  date: Date;
  duration: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudySchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

StudySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Study = mongoose.model<IStudy>('Study', StudySchema); 