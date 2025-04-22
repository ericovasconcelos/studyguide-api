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

export function useGranToken() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('granToken'));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const userId = getCurrentUserId();

  // Salvar o token no banco de dados (memoized)
  const saveTokenToDB = useCallback(async (tokenToSave: string): Promise<void> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/gran-token/${userId}`, {
        granToken: tokenToSave
      });
      logger.info('Token do Gran Cursos salvo no banco de dados');
    } catch (err) {
      // Extrair mensagem de erro mais detalhada da resposta da API
      let errorMessage = 'Erro ao salvar token do Gran no banco de dados';
      if (axios.isAxiosError(err) && err.response) {
        // Se houver resposta da API com mensagem de erro
        const apiError = err.response.data?.error || err.response.data?.message;
        if (apiError) {
          errorMessage = `Erro: ${apiError}`;
        }
      }
      
      logger.error(errorMessage, err);
      throw new Error(errorMessage);
    }
  }, [userId]);

  // Carregar o token do banco de dados (se disponível)
  useEffect(() => {
    const loadTokenFromDB = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tentar buscar do backend primeiro
        try {
          const response = await axios.get(`${API_BASE_URL}/api/gran-token/${userId}`);
          
          // Se a resposta for bem-sucedida e tiver um token, use-o
          if (response.data.success && response.data.data.granToken) {
            const tokenData = response.data.data;
            setToken(tokenData.granToken);
            setLastUpdated(new Date(tokenData.granTokenUpdatedAt));
            
            // Sincronizar com localStorage para compatibilidade
            localStorage.setItem('granToken', tokenData.granToken);
            
            logger.info('Token do Gran Cursos carregado do banco de dados');
          } else if (token) {
            // Se não houver token no banco, mas temos no localStorage, salve-o no banco
            await saveTokenToDB(token);
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
      await saveTokenToDB(newToken);
      
      // Atualizar estado local
      setToken(newToken);
      setLastUpdated(new Date());
      
      // Salvar no localStorage para compatibilidade
      localStorage.setItem('granToken', newToken);
      
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
  }, [saveTokenToDB]);

  // Remover token
  const clearToken = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Remover do banco de dados
      try {
        await axios.delete(`${API_BASE_URL}/api/gran-token/${userId}`);
        logger.info('Token do Gran Cursos removido do banco de dados');
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

      // Remover do localStorage
      localStorage.removeItem('granToken');
      
      // Atualizar estado local
      setToken(null);
      setLastUpdated(null);
      
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