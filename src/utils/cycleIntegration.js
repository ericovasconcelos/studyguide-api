/**
 * Módulo de integração com a API de ciclos do Gran Cursos
 * 
 * Este módulo fornece funções para buscar, processar e gerenciar ciclos de estudo,
 * incluindo a integração entre os dados da API e as metas locais.
 */

import axios from 'axios';

// URL base da API do Gran Cursos
const API_BASE_URL = 'https://bj4jvnteuk.execute-api.us-east-1.amazonaws.com/v1';

/**
 * Busca ciclos de estudo da API do Gran Cursos
 * @param {string} token - Token de autenticação
 * @param {boolean} useLocalFallback - Se deve usar dados locais em caso de falha
 * @returns {Promise<Array>} - Lista de ciclos de estudo
 */
export const fetchCyclesFromAPI = async (token, useLocalFallback = true) => {
  try {
    // Verificar se o token está presente
    if (!token) {
      throw new Error('Token não fornecido');
    }

    // Configurar a requisição
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Buscar dados de ciclos
    const response = await axios.get(`${API_BASE_URL}/ciclo-estudo?page=1&perPage=50`, config);
    
    // Verificar se há dados válidos
    if (!response.data || !response.data.data || !response.data.data.rows) {
      throw new Error('Formato de resposta inválido da API de ciclos');
    }

    // Mapear os dados para o formato da aplicação
    const cycles = response.data.data.rows.map(mapCycleData);
    
    return cycles;
  } catch (error) {
    // Tratar erros específicos
    if (error.response) {
      // Erro de resposta da API
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error(`Token inválido ou expirado: ${error.response.data?.message || 'Acesso negado'}`);
      }
      
      throw new Error(`Erro ao buscar ciclos: ${error.response.data?.message || error.message}`);
    }
    
    // Se for para usar fallback e houver um erro de conexão
    if (useLocalFallback) {
      console.warn('Falha ao buscar ciclos da API, usando dados locais:', error.message);
      // Buscar ciclos salvos localmente
      const localCycles = JSON.parse(localStorage.getItem('studyCycles') || '[]');
      return localCycles;
    }
    
    // Repassar o erro
    throw error;
  }
};

/**
 * Mapeia os dados brutos de um ciclo para o formato usado pela aplicação
 * @param {Object} rawCycle - Dados brutos do ciclo da API
 * @returns {Object} - Ciclo no formato da aplicação
 */
export const mapCycleData = (rawCycle) => {
  return {
    id: rawCycle.id,
    name: rawCycle.nome || rawCycle.descricao || 'Ciclo sem nome',
    startDate: rawCycle.dataInicio || new Date().toISOString().split('T')[0],
    endDate: rawCycle.dataFim || null,
    isActive: rawCycle.ativo || true,
    isFromAPI: true // Marca que este ciclo vem da API
  };
};

/**
 * Detecta as rodadas (versões) disponíveis para um ciclo específico
 * @param {string} token - Token de autenticação
 * @param {number} cycleId - ID do ciclo
 * @returns {Promise<Array>} - Lista de rodadas/versões encontradas
 */
export const detectCycleRounds = async (token, cycleId) => {
  try {
    // Verificar parâmetros
    if (!token) {
      throw new Error('Token não fornecido');
    }
    
    if (!cycleId) {
      throw new Error('ID do ciclo não fornecido');
    }

    // Configurar a requisição
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Buscar registros de estudo deste ciclo
    const response = await axios.get(
      `${API_BASE_URL}/estudo?page=1&perPage=100&sort=desc`, 
      config
    );
    
    // Verificar se há dados válidos
    if (!response.data || !response.data.data || !response.data.data.rows) {
      throw new Error('Formato de resposta inválido da API de estudos');
    }

    // Filtrar registros deste ciclo
    const cycleRecords = response.data.data.rows.filter(
      record => record.cicloId === cycleId || record.cicloId === String(cycleId)
    );
    
    // Extrair versões únicas
    const versionsSet = new Set();
    const cycleName = cycleRecords.length > 0 ? cycleRecords[0].cicloTexto : '';
    
    cycleRecords.forEach(record => {
      const version = record.versao || 1;
      versionsSet.add(version);
    });
    
    // Converter para array e formatar
    const rounds = Array.from(versionsSet).map(version => ({
      version: typeof version === 'string' ? parseInt(version, 10) : version,
      cycleId,
      cycleName
    }));
    
    // Ordenar por versão
    rounds.sort((a, b) => a.version - b.version);
    
    return rounds;
  } catch (error) {
    console.error('Erro ao detectar rodadas do ciclo:', error);
    throw error;
  }
};

/**
 * Mescla um ciclo com suas metas locais
 * @param {Object} cycle - Ciclo a ser mesclado
 * @returns {Object} - Ciclo com suas metas
 */
export const mergeCycleWithLocalGoals = (cycle) => {
  try {
    // Buscar metas salvas localmente
    const localGoals = JSON.parse(localStorage.getItem('cycleGoals') || '{}');
    
    // Verificar se há metas para este ciclo
    const cycleGoals = localGoals[cycle.id] || {};
    
    // Mesclar com o ciclo
    return {
      ...cycle,
      goals: cycleGoals
    };
  } catch (error) {
    console.error('Erro ao mesclar ciclo com metas locais:', error);
    // Retornar o ciclo sem metas em caso de erro
    return { ...cycle, goals: {} };
  }
};

/**
 * Calcula o progresso de uma disciplina em uma rodada específica
 * @param {Array} records - Registros de estudo
 * @param {number} subjectId - ID da disciplina
 * @param {number} version - Versão/rodada
 * @param {number} targetTime - Tempo alvo em minutos
 * @returns {number} - Porcentagem de progresso (0-100)
 */
export const calculateProgress = (records, subjectId, version, targetTime) => {
  try {
    // Filtrar registros pela disciplina e versão
    const filteredRecords = records.filter(
      record => (record.disciplinaId === subjectId || record.disciplinaId === String(subjectId)) && 
                (record.versao === version || record.versao === String(version))
    );
    
    // Somar o tempo gasto (em segundos)
    const totalTimeInSeconds = filteredRecords.reduce((total, record) => {
      return total + (record.tempoGasto || 0);
    }, 0);
    
    // Converter para minutos
    const totalTimeInMinutes = totalTimeInSeconds / 60;
    
    // Calcular progresso
    const progress = Math.min(Math.round((totalTimeInMinutes / targetTime) * 100), 100);
    
    return progress;
  } catch (error) {
    console.error('Erro ao calcular progresso:', error);
    return 0;
  }
};

/**
 * Salva as metas locais, mesclando com as existentes
 * @param {Object} newGoals - Novas metas a serem salvas
 */
export const saveLocalGoals = (newGoals) => {
  try {
    // Buscar metas salvas anteriormente
    const existingGoals = JSON.parse(localStorage.getItem('cycleGoals') || '{}');
    
    // Mesclar as metas (deep merge)
    const mergedGoals = mergeDeep(existingGoals, newGoals);
    
    // Salvar as metas mescladas
    localStorage.setItem('cycleGoals', JSON.stringify(mergedGoals));
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar metas locais:', error);
    return false;
  }
};

/**
 * Função auxiliar para mesclar objetos profundamente
 */
const mergeDeep = (target, source) => {
  // Para cada propriedade na fonte
  for (const key in source) {
    // Pular protótipo
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    
    // Se ambos são objetos e não null, mesclar recursivamente
    if (
      source[key] && 
      typeof source[key] === 'object' && 
      !Array.isArray(source[key]) &&
      target[key] && 
      typeof target[key] === 'object' && 
      !Array.isArray(target[key])
    ) {
      mergeDeep(target[key], source[key]);
    } else {
      // Caso contrário, sobrescrever a propriedade
      target[key] = source[key];
    }
  }
  
  return target;
};

export default {
  fetchCyclesFromAPI,
  mapCycleData,
  detectCycleRounds,
  mergeCycleWithLocalGoals,
  calculateProgress,
  saveLocalGoals
};