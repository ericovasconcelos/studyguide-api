import { Request, Response } from 'express';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { AuthService } from '../services/AuthService';
import { logger } from '../utils/logger';

// Armazenamento simples para tentativas de login (em produção, usar Redis ou similar)
interface LoginAttempt {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

export class AuthController {
  constructor(
    private userRepository: IUserRepository,
    private authService: AuthService
  ) {}

  /**
   * Método para autenticar um usuário
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const ip = req.ip || 'unknown';

      // Validar campos obrigatórios
      if (!email) {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }

      if (!password) {
        res.status(400).json({ success: false, error: 'Password is required' });
        return;
      }

      // Verificar tentativas de login (proteção contra brute force)
      const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      
      // Se estiver bloqueado, verificar se o tempo já passou
      if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
        const minutesLeft = Math.ceil((attempt.blockedUntil - Date.now()) / 60000);
        res.status(429).json({ 
          success: false, 
          error: `Too many failed attempts. Try again in ${minutesLeft} minutes.` 
        });
        return;
      }

      // Buscar usuário pelo email
      const user = await this.userRepository.findByEmail(email);
      
      if (!user) {
        // Incrementar tentativas de login
        this.recordLoginAttempt(ip);
        
        // Por segurança, não informamos qual campo está incorreto
        res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
        return;
      }

      // Validar senha
      const passwordResult = await user.validatePassword(password);
      
      if (passwordResult.failed() || !passwordResult.getValue()) {
        // Incrementar tentativas de login
        this.recordLoginAttempt(ip);
        
        res.status(401).json({ 
          success: false, 
          error: 'Invalid credentials' 
        });
        return;
      }

      // Login bem-sucedido, resetar contador de tentativas
      loginAttempts.delete(ip);

      // Gerar token JWT
      const token = this.authService.generateToken(user);

      // Responder com os dados do usuário e token
      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.getId(),
            email: user.getEmail(),
            name: user.getName(),
            role: user.getRole()
          }
        }
      });
    } catch (error) {
      logger.error('Error during login', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Método para alterar a senha do usuário
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId, currentPassword, newPassword } = req.body;

      // Validar campos obrigatórios
      if (!userId) {
        res.status(400).json({ success: false, error: 'User ID is required' });
        return;
      }

      if (!currentPassword) {
        res.status(400).json({ success: false, error: 'Current password is required' });
        return;
      }

      if (!newPassword) {
        res.status(400).json({ success: false, error: 'New password is required' });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        return;
      }

      // Buscar usuário pelo ID
      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Validar senha atual
      const passwordResult = await user.validatePassword(currentPassword);
      
      if (passwordResult.failed() || !passwordResult.getValue()) {
        res.status(401).json({ success: false, error: 'Current password is incorrect' });
        return;
      }

      // Definir nova senha
      const setPasswordResult = await user.setPassword(newPassword);
      
      if (setPasswordResult.failed()) {
        res.status(400).json({ success: false, error: setPasswordResult.getError() });
        return;
      }

      // Salvar usuário com a nova senha
      await this.userRepository.update(user);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Error changing password', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Método privado para registrar tentativas de login
   */
  private recordLoginAttempt(ip: string): void {
    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempt.count++;
    attempt.lastAttempt = Date.now();
    
    // Se exceder o limite de tentativas, bloquear o IP
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      attempt.blockedUntil = Date.now() + BLOCK_DURATION_MS;
      logger.warn(`IP ${ip} blocked due to too many failed login attempts`);
    }
    
    loginAttempts.set(ip, attempt);
  }
} 