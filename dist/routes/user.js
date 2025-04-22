"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = require("../domain/entities/User");
const MongoUserRepository_1 = require("../infrastructure/repositories/MongoUserRepository");
const logger_1 = require("../utils/logger");
const router = express_1.default.Router();
const userRepository = new MongoUserRepository_1.MongoUserRepository();
// Criar um novo usuário
router.post('/', async (req, res) => {
    try {
        const { id, email, name, password, role } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, error: 'ID is required' });
        }
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }
        if (!name) {
            return res.status(400).json({ success: false, error: 'Name is required' });
        }
        // Verificar se o usuário já existe
        const existingUser = await userRepository.findById(id);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists with this ID' });
        }
        // Criar um novo usuário
        const userResult = User_1.User.create({
            id: id,
            email: email,
            name: name,
            passwordHash: password || '', // Normalmente deve-se fazer hash da senha, mas simplificando para fins de teste
            role: role || 'user',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        if (userResult.failed()) {
            return res.status(400).json({ success: false, error: userResult.getError() });
        }
        // Salvar o novo usuário
        const user = await userRepository.save(userResult.getValue());
        logger_1.logger.info(`New user created with ID: ${id}`);
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: user.getId(),
                email: user.getEmail(),
                name: user.getName(),
                role: user.getRole(),
                createdAt: user.getCreatedAt()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error creating user', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Obter um usuário pelo ID
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        const user = await userRepository.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        res.status(200).json({
            success: true,
            data: {
                id: user.getId(),
                email: user.getEmail(),
                name: user.getName(),
                role: user.getRole(),
                createdAt: user.getCreatedAt(),
                updatedAt: user.getUpdatedAt()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Error getting user', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=user.js.map