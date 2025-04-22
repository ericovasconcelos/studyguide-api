"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const result_1 = require("../domain/result");
const logger_1 = require("../utils/logger");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class AuthService {
    constructor(jwtSecret, tokenExpiration) {
        this.context = 'AuthService';
        this.jwtSecret = jwtSecret;
        this.tokenExpiration = tokenExpiration;
    }
    generateToken(user) {
        const payload = {
            userId: user.getId(),
            email: user.getEmail(),
            role: user.getRole()
        };
        return jsonwebtoken_1.default.sign(payload, this.jwtSecret, {
            expiresIn: this.tokenExpiration
        });
    }
    async validateToken(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            return result_1.Result.ok(payload);
        }
        catch (error) {
            logger_1.logger.error(this.context, 'Invalid token', { error });
            return result_1.Result.fail('Invalid token');
        }
    }
    async hashPassword(password) {
        const salt = await bcryptjs_1.default.genSalt(10);
        return bcryptjs_1.default.hash(password, salt);
    }
    async comparePasswords(password, hashedPassword) {
        return bcryptjs_1.default.compare(password, hashedPassword);
    }
    async authorize(user, resource, action) {
        // Implement role-based access control
        if (user.getRole() === 'admin') {
            return true;
        }
        // Add more specific authorization rules here
        return false;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map