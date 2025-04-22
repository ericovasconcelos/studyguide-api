import mongoose, { Document } from 'mongoose';
import { Result } from '../../domain/result';
import { User, UserProps } from '../../domain/entities/User';

interface IUserDocument extends Document {
  _id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  granToken?: string;
  granTokenUpdatedAt?: Date;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  toDomain(): User;
}

const userSchema = new mongoose.Schema({
  _id: { type: String },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  granToken: { type: String },
  granTokenUpdatedAt: { type: Date },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add toDomain method to convert MongoDB document to domain entity
userSchema.methods.toDomain = function(this: IUserDocument) {
  const props: UserProps = {
    id: this._id,
    email: this.email,
    name: this.name,
    passwordHash: this.passwordHash,
    role: this.role,
    granToken: this.granToken,
    granTokenUpdatedAt: this.granTokenUpdatedAt,
    settings: this.settings || {},
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
  
  const result = User.create(props);
  if (result.failed()) {
    throw new Error(result.getError());
  }
  
  return result.getValue();
};

export const UserModel = mongoose.model<IUserDocument>('User', userSchema); 