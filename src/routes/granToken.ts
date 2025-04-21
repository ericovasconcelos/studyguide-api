import express from 'express';
import { GranTokenController } from '../controllers/GranTokenController';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';

const router = express.Router();
const userRepository = new MongoUserRepository();
const granTokenController = new GranTokenController(userRepository);

// Obter token do Gran
router.get('/:userId', async (req, res) => {
  await granTokenController.getToken(req, res);
});

// Salvar token do Gran
router.post('/:userId', async (req, res) => {
  await granTokenController.saveToken(req, res);
});

// Remover token do Gran
router.delete('/:userId', async (req, res) => {
  await granTokenController.clearToken(req, res);
});

export default router; 