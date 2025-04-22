import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import axios from 'axios';
import { getCurrentUserId, setPermanentUserId } from '../config/auth';
import { logger } from '../utils/logger';
import { notification } from 'antd';
import { API_BASE_URL } from '../config/api';
import { User } from '../domain/entities/User';

// Interface para o usuário autenticado
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

// Criar o contexto com um valor padrão
export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: false,
  error: null,
  login: async () => {},
  register: async () => false,
  logout: () => {},
  isAuthenticated: false,
});

// Interface para as props do provedor
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!token);

  // Efeito para verificar o token ao carregar
  useEffect(() => {
    const checkToken = async () => {
      const storedToken = localStorage.getItem('auth_token');
      
      if (storedToken) {
        try {
          // Configurar o token para todas as requisições
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setIsAuthenticated(true);
          
          // TODO: implementar verificação do token com o backend
          // por enquanto, apenas carrega os dados do usuário do localStorage
          const userData = localStorage.getItem('auth_user');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        } catch (err) {
          logger.error('Error validating token', err);
          logout(); // Limpar token inválido
        }
      }
    };

    checkToken();
  }, []);

  // Função de login
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Salvar token e informações do usuário
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        // Atualizar estado
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        // Configurar o token para todas as requisições
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Atualizar o ID do usuário para o permanente
        setPermanentUserId(user.id);
        
        logger.info('User logged in successfully', { userId: user.id });
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (err) {
      logger.error('Login error', err);
      
      let errorMessage = 'Falha na autenticação. Tente novamente.';
      
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.error || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Função de registro
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Gerar um ID único para o usuário
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Registrar o usuário no backend
      const registerResponse = await axios.post(`${API_BASE_URL}/api/users`, {
        id: userId,
        name,
        email,
        password,
        role: 'user'
      });
      
      if (registerResponse.data.success) {
        logger.info('User registered successfully', { userId });
        
        // Exibir notificação de sucesso
        notification.success({
          message: 'Conta criada com sucesso!',
          description: 'Você pode fazer login agora.',
          placement: 'topRight'
        });
        
        // Retorna sucesso - não faz login automático
        return true;
      } else {
        throw new Error(registerResponse.data.error || 'Registration failed');
      }
    } catch (err) {
      logger.error('Registration error', err);
      
      let errorMessage = 'Falha no registro. Tente novamente.';
      
      if (axios.isAxiosError(err) && err.response) {
        // Obter mensagem de erro específica da API
        if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
          
          // Traduzir mensagens de erro comuns para melhor UX
          if (errorMessage === 'Email already registered') {
            errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
          } else if (errorMessage === 'User already exists with this ID') {
            errorMessage = 'Erro interno: ID de usuário já existe. Tente novamente.';
          }
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      // Limpar tokens da sessão do usuário atual antes de deslogar
      const currentUser = user;
      if (currentUser?.id) {
        try {
          // Limpar todos os tokens associados ao usuário
          const granTokenKey = `granToken_${currentUser.id}`;
          localStorage.removeItem(granTokenKey);
          
          // Tenta remover o token legado também (sem prefixo)
          localStorage.removeItem('granToken');
          
          // Opcional: tentar limpar no servidor também
          await axios.delete(`${API_BASE_URL}/api/users/${currentUser.id}/grantoken`).catch(() => {
            // Ignora erros aqui, já que estamos no processo de logout
            console.log('Não foi possível limpar o token no servidor durante logout');
          });
        } catch (error) {
          console.error('Erro ao limpar tokens durante logout:', error);
          // Continua com o logout mesmo se falhar a limpeza de tokens
        }
      }

      // Limpar token e dados do usuário
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      // Limpar headers
      delete axios.defaults.headers.common['Authorization'];
      
      // Atualizar estado
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      
      logger.info('User logged out');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Objeto com os valores do contexto
  const contextValue: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 