import express from 'express';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { logger } from '../utils/logger';

// Configuração do serviço de autenticação
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION || '24h';

const router = express.Router();
const userRepository = new MongoUserRepository();
const authService = new AuthService(JWT_SECRET, TOKEN_EXPIRATION);
const authController = new AuthController(userRepository, authService);

// Rota de login
router.post('/login', async (req, res) => {
  await authController.login(req, res);
});

// Rota para troca de senha
router.post('/change-password', async (req, res) => {
  await authController.changePassword(req, res);
});

// Rota para verificar o status da autenticação (útil para o frontend)
router.get('/status', async (req, res) => {
  res.json({
    success: true,
    message: 'Authentication service is running'
  });
});

export default router; 