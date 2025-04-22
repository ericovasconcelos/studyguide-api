import { useState, useEffect, useCallback } from 'react';
import { getCurrentUserId } from '../config/auth';
import { logger } from '../utils/logger';
import axios from 'axios';

// Get the correct API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface GranTokenData {
  granToken: string | null;
  granTokenUpdatedAt: Date | null;
}

// Adicionar prefixo do usuário à chave do localStorage
const getLocalStorageKey = (userId: string) => `granToken_${userId}`;

export function useGranToken() {
  const [token, setToken] = useState<string | null>(localStorage.getItem(getLocalStorageKey(getCurrentUserId())));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const userId = getCurrentUserId();

  // Salvar o token no banco de dados (memoized)
  const saveTokenToDB = useCallback(async (userId: string, tokenToSave: string): Promise<void> => {
    try {
      logger.info(`Saving token for user ${userId}`);
      
      const response = await axios.post(`${API_BASE_URL}/api/users/${userId}/grantoken`, {
        granToken: tokenToSave
      });
      
      if (!response.data.success) {
        const errorMessage = response.data.error || 'Failed to save token';
        logger.error(`Error saving token: ${errorMessage}`);
        throw new Error(errorMessage);
      }
      
      // Atualizar o localStorage COM O ID DO USUÁRIO na chave
      localStorage.setItem(getLocalStorageKey(userId), tokenToSave);
      
      logger.info('Token saved successfully');
    } catch (error: any) {
      logger.error('Error saving token:', error);
      
      // Extrair mensagem de erro detalhada da resposta da API se disponível
      let errorMessage = 'Failed to save token';
      if (error.response?.data?.error) {
        errorMessage = `${errorMessage}: ${error.response.data.error}`;
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  // Carregar o token do banco de dados (se disponível)
  useEffect(() => {
    const loadTokenFromDB = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tentar buscar do backend primeiro
        try {
          const response = await axios.get(`${API_BASE_URL}/api/users/${userId}/grantoken`);
          
          if (response.data?.granToken) {
            logger.info('Token loaded from database');
            const tokenData = response.data;
            setToken(tokenData.granToken);
            setLastUpdated(new Date(tokenData.granTokenUpdatedAt));
            
            // Sincronizar com localStorage para compatibilidade
            localStorage.setItem(getLocalStorageKey(userId), tokenData.granToken);
            
            logger.info('Token do Gran Cursos carregado do banco de dados');
          } else if (token) {
            // Se não houver token no banco, mas temos no localStorage, salve-o no banco
            await saveTokenToDB(userId, token);
          }
        } catch (err) {
          // Se falhar a busca no backend, usar o localStorage como fallback
          logger.warn('Falha ao buscar token do Gran do banco, usando localStorage', err);
          
          // Se temos um token no localStorage, atualiza o estado
          if (token) {
            setToken(token);
            setLastUpdated(new Date());
          }
        }
      } catch (err) {
        setError('Erro ao carregar token do Gran Cursos');
        logger.error('Erro ao carregar token do Gran Cursos', err);
      } finally {
        setLoading(false);
      }
    };

    loadTokenFromDB();
  }, [userId, token, saveTokenToDB]);

  // Salvar token no banco de dados e localStorage
  const saveToken = useCallback(async (newToken: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Salvar no banco de dados
      await saveTokenToDB(userId, newToken);
      
      // Atualizar estado local
      setToken(newToken);
      setLastUpdated(new Date());
      
      // Salvar no localStorage para compatibilidade
      localStorage.setItem(getLocalStorageKey(userId), newToken);
      
      return true;
    } catch (err) {
      // Usar a mensagem de erro detalhada que vem do saveTokenToDB
      const errorMsg = err instanceof Error ? err.message : 'Erro ao salvar token';
      setError(errorMsg);
      logger.error('Erro ao salvar token do Gran Cursos', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, saveTokenToDB]);

  // Remover token
  const clearToken = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Remover do banco de dados
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/users/${userId}/grantoken`);
        
        if (!response.data.success) {
          const errorMessage = response.data.error || 'Failed to clear token';
          logger.error(`Error clearing token: ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        // Remover do localStorage
        localStorage.removeItem(getLocalStorageKey(userId));
        
        // Atualizar estado local
        setToken(null);
        setLastUpdated(null);
        
        logger.info('Token cleared successfully');
      } catch (err) {
        // Extrair mensagem de erro mais detalhada da resposta da API
        let errorMessage = 'Erro ao remover token do Gran do banco de dados';
        if (axios.isAxiosError(err) && err.response) {
          const apiError = err.response.data?.error || err.response.data?.message;
          if (apiError) {
            errorMessage = `Erro: ${apiError}`;
          }
        }
        
        logger.warn(errorMessage, err);
        throw new Error(errorMessage);
      }

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao remover token';
      setError(errorMsg);
      logger.error('Erro ao remover token do Gran Cursos', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    token,
    loading,
    error,
    lastUpdated,
    saveToken,
    clearToken
  };
} 