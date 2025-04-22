"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Study_1 = require("../../domain/entities/Study");
const Duration_1 = require("../../domain/value-objects/Duration");
const studySchema = new mongoose_1.default.Schema({
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    duration: { type: Number, required: true }, // Store as number
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
studySchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Add toDomain method to convert MongoDB document to domain entity
studySchema.methods.toDomain = function () {
    var _a;
    const durationResult = Duration_1.Duration.create(this.duration);
    if (durationResult.failed()) {
        throw new Error(durationResult.getError());
    }
    const props = {
        id: this._id.toString(),
        userId: this.userId,
        date: this.date,
        subject: this.subject,
        topic: this.topic,
        duration: this.duration,
        notes: (_a = this.notes) !== null && _a !== void 0 ? _a : '',
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
    };
    const result = Study_1.Study.create(props);
    if (result.failed()) {
        throw new Error(result.getError());
    }
    return result.getValue();
};
exports.StudyModel = mongoose_1.default.model('Study', studySchema);
//# sourceMappingURL=StudyModel.js.map