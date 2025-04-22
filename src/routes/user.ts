import express from 'express';
import { User } from '../domain/entities/User';
import { MongoUserRepository } from '../infrastructure/repositories/MongoUserRepository';
import { logger } from '../utils/logger';

const router = express.Router();
const userRepository = new MongoUserRepository();

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

    // Verificar se já existe um usuário com o mesmo email
    const existingUserWithEmail = await userRepository.findByEmail(email);
    if (existingUserWithEmail) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    // Verificar se o usuário já existe com mesmo ID
    const existingUser = await userRepository.findById(id);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists with this ID' });
    }

    // Criar um novo usuário
    const userResult = User.create({
      id: id,
      email: email,
      name: name,
      passwordHash: '', // Campo inicial vazio, será definido com hash abaixo
      role: role || 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    if (userResult.failed()) {
      return res.status(400).json({ success: false, error: userResult.getError() });
    }

    // Definir a senha com hash
    const user = userResult.getValue();
    const passwordResult = await user.setPassword(password || '');
    
    if (passwordResult.failed()) {
      return res.status(400).json({ success: false, error: passwordResult.getError() });
    }

    // Salvar o novo usuário
    const savedUser = await userRepository.save(user);
    logger.info(`New user created with ID: ${id}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: savedUser.getId(),
        email: savedUser.getEmail(),
        name: savedUser.getName(),
        role: savedUser.getRole(),
        createdAt: savedUser.getCreatedAt()
      }
    });
  } catch (error: any) {
    logger.error('Error creating user', error);
    
    // Extrair mensagem de erro mais específica
    let errorMessage = 'Internal server error';
    
    if (error.message) {
      // Usar mensagens de erro específicas para melhor UX
      if (error.message.includes('Email already registered') || 
          error.message.includes('User with this ID already exists')) {
        errorMessage = error.message;
        return res.status(400).json({ success: false, error: errorMessage });
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
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
  } catch (error) {
    logger.error('Error getting user', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router; 