"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const result_1 = require("../result");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class User {
    constructor(props) {
        this.id = props.id;
        this.email = props.email;
        this.name = props.name;
        this.passwordHash = props.passwordHash;
        this.role = props.role || 'user';
        this.granToken = props.granToken;
        this.granTokenUpdatedAt = props.granTokenUpdatedAt;
        this.settings = props.settings || {};
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    static create(props) {
        if (!props.id) {
            return result_1.Result.fail('Id is required');
        }
        if (!props.email) {
            return result_1.Result.fail('Email is required');
        }
        if (!props.name) {
            return result_1.Result.fail('Name is required');
        }
        if (!props.passwordHash) {
            return result_1.Result.fail('Password hash is required');
        }
        if (!props.createdAt) {
            props.createdAt = new Date();
        }
        if (!props.updatedAt) {
            props.updatedAt = new Date();
        }
        return result_1.Result.ok(new User(props));
    }
    getId() {
        return this.id;
    }
    getEmail() {
        return this.email;
    }
    getName() {
        return this.name;
    }
    getPasswordHash() {
        return this.passwordHash;
    }
    getGranToken() {
        return this.granToken;
    }
    getGranTokenUpdatedAt() {
        return this.granTokenUpdatedAt;
    }
    getSettings() {
        return { ...this.settings };
    }
    getCreatedAt() {
        return this.createdAt;
    }
    getUpdatedAt() {
        return this.updatedAt;
    }
    getRole() {
        return this.role;
    }
    setEmail(email) {
        if (!email) {
            return result_1.Result.fail('Email is required');
        }
        this.email = email;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setName(name) {
        if (!name) {
            return result_1.Result.fail('Name is required');
        }
        this.name = name;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setPasswordHash(passwordHash) {
        if (!passwordHash) {
            return result_1.Result.fail('Password hash is required');
        }
        this.passwordHash = passwordHash;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setGranToken(token) {
        this.granToken = token;
        this.granTokenUpdatedAt = new Date();
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    clearGranToken() {
        this.granToken = undefined;
        this.granTokenUpdatedAt = undefined;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    updateSetting(key, value) {
        this.settings[key] = value;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    setRole(role) {
        this.role = role;
        this.updatedAt = new Date();
        return result_1.Result.ok(undefined);
    }
    toEntity() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            passwordHash: this.passwordHash,
            role: this.role,
            granToken: this.granToken,
            granTokenUpdatedAt: this.granTokenUpdatedAt,
            settings: this.settings,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
    async setPassword(password) {
        if (!password || password.length < 6) {
            return result_1.Result.fail('Password must be at least 6 characters');
        }
        try {
            const salt = await bcryptjs_1.default.genSalt(10);
            this.passwordHash = await bcryptjs_1.default.hash(password, salt);
            this.updatedAt = new Date();
            return result_1.Result.ok(undefined);
        }
        catch (error) {
            return result_1.Result.fail('Failed to hash password');
        }
    }
    async validatePassword(password) {
        try {
            const isValid = await bcryptjs_1.default.compare(password, this.passwordHash);
            return result_1.Result.ok(isValid);
        }
        catch (error) {
            return result_1.Result.fail('Failed to validate password');
        }
    }
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            passwordHash: this.passwordHash,
            role: this.role,
            granToken: this.granToken,
            granTokenUpdatedAt: this.granTokenUpdatedAt,
            settings: this.settings,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map