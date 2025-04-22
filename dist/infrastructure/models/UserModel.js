"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../../domain/entities/User");
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'user', enum: ['user', 'admin'] },
    granToken: { type: String },
    granTokenUpdatedAt: { type: Date },
    settings: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Add toDomain method to convert MongoDB document to domain entity
userSchema.methods.toDomain = function () {
    const props = {
        id: this._id.toString(),
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
    const result = User_1.User.create(props);
    if (result.failed()) {
        throw new Error(result.getError());
    }
    return result.getValue();
};
exports.UserModel = mongoose_1.default.model('User', userSchema);
//# sourceMappingURL=UserModel.js.map