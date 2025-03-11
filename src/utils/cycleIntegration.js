/**
 * Módulo de integração com a API de ciclos do Gran Cursos
 * 
 * Este módulo fornece funções para buscar, processar e gerenciar ciclos de estudo,
 * incluindo a integração entre os dados da API e as metas locais.
 */

// Importação do axios de forma consistente para evitar problemas
const axios = require('axios');

// URL base da API do Gran Cursos
const API_BASE_URL = 'https://bj4jvnteuk.execute-api.us-east-1.amazonaws.com/v1';

/**
 * Busca ciclos de estudo da API do Gran Cursos
 * @param {string} token - Token de autenticação
 * @param {boolean} useLocalFallback - Se deve usar dados locais em caso de falha
 * @returns {Promise<Array>} - Lista de ciclos de estudo
 */
const fetchCyclesFromAPI = async (token, useLocalFallback = true) => {
  console.log('Iniciando busca de ciclos com token:', token ? 'Token presente' : 'Token ausente');
  try {
    // Verificar se o token está presente
    if (!token) {
      console.error('Token não fornecido');
      throw new Error('Token não fornecido');
    }

    // Configurar a requisição
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    // Vamos tentar obter ciclos a partir dos registros de estudo já que o endpoint de ciclos retorna vazio
    console.log('Fazendo requisição para endpoint de estudo para extrair ciclos...');
    const studyResponse = await axios.get(`${API_BASE_URL}/estudo?page=1&perPage=100`, config);
    
    console.log('Resposta de estudo recebida:', studyResponse.status);
    
    // Verificar se há dados válidos
    if (!studyResponse.data || !studyResponse.data.data || !studyResponse.data.data.rows) {
      console.error('Formato de resposta inválido do endpoint de estudo:', studyResponse.data);
      throw new Error('Não foi possível obter dados de estudo para extrair ciclos');
    }

    // Extrair ciclos únicos dos registros de estudo
    const studyRecords = studyResponse.data.data.rows;
    console.log(`Total de registros de estudo: ${studyRecords.length}`);
    
    // Map para armazenar ciclos únicos por ID
    const cyclesMap = new Map();
    
    // Extrair informações de ciclo de cada registro
    studyRecords.forEach(record => {
      if (record.cicloId) {
        // Se este ciclo ainda não foi registrado, adicionar ao map
        if (!cyclesMap.has(record.cicloId)) {
          cyclesMap.set(record.cicloId, {
            id: record.cicloId,
            name: record.cicloTexto || `Ciclo ${record.cicloId}`,
            startDate: record.dataEstudo ? record.dataEstudo.split('T')[0] : new Date().toISOString().split('T')[0],
            isActive: true,
            isFromAPI: true
          });
        }
      }
    });
    
    // Converter o Map para array
    const cycles = Array.from(cyclesMap.values());
    console.log(`Ciclos extraídos com sucesso: ${cycles.length} ciclos`);
    
    // Salvar os ciclos localmente para uso futuro
    localStorage.setItem('studyCycles', JSON.stringify(cycles));
    
    return cycles;
  } catch (error) {
    console.error('Erro completo ao buscar ciclos:', error);
    
    // Tratar erros específicos
    if (error.response) {
      // Erro de resposta da API
      console.error('Erro de resposta:', error.response.status, error.response.statusText);
      console.error('Dados do erro:', error.response.data);
      
      if (error.response.status === 401 || error.response.status === 403) {
        throw new Error(`Token inválido ou expirado: ${error.response.data?.message || 'Acesso negado'}`);
      }
      
      throw new Error(`Erro ao buscar ciclos: ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor:', error.request);
      throw new Error('Sem resposta do servidor. Verifique sua conexão com a internet.');
    }
    
    // Se for para usar fallback e houver um erro de conexão
    if (useLocalFallback) {
      console.warn('Falha ao buscar ciclos da API, usando dados locais:', error.message);
      // Buscar ciclos salvos localmente
      const localCycles = JSON.parse(localStorage.getItem('studyCycles') || '[]');
      return localCycles;
    }
    
    // Repassar o erro
    console.error('Erro não tratado:', error.message);
    throw error;
  }
};

/**
 * Mapeia os dados brutos de um ciclo para o formato usado pela aplicação
 * @param {Object} rawCycle - Dados brutos do ciclo da API
 * @returns {Object} - Ciclo no formato da aplicação
 */
const mapCycleData = (rawCycle) => {
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
const detectCycleRounds = async (token, cycleId) => {
  console.log(`Detectando rodadas para ciclo ID: ${cycleId}`);
  try {
    // Verificar parâmetros
    if (!token) {
      console.error('Token não fornecido para detectCycleRounds');
      throw new Error('Token não fornecido');
    }
    
    if (!cycleId) {
      console.error('ID do ciclo não fornecido para detectCycleRounds');
      throw new Error('ID do ciclo não fornecido');
    }

    // Configurar a requisição
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('Buscando registros de estudo da API...');
    
    // Buscar registros de estudo deste ciclo
    const response = await axios.get(
      `${API_BASE_URL}/estudo?page=1&perPage=100&sort=desc`, 
      config
    );
    
    console.log('Resposta de estudo recebida:', response.status);
    
    // Verificar se há dados válidos
    if (!response.data || !response.data.data || !response.data.data.rows) {
      console.error('Formato de resposta inválido:', response.data);
      throw new Error('Formato de resposta inválido da API de estudos');
    }

    console.log(`Total de registros recebidos: ${response.data.data.rows.length}`);

    // Filtrar registros deste ciclo
    const cycleRecords = response.data.data.rows.filter(record => {
      const matchesCycle = record.cicloId == cycleId; // Comparação não estrita para permitir string/number
      return matchesCycle;
    });
    
    console.log(`Registros filtrados para o ciclo ${cycleId}: ${cycleRecords.length}`);
    
    // Extrair versões únicas
    const versionsSet = new Set();
    const cycleName = cycleRecords.length > 0 ? cycleRecords[0].cicloTexto : '';
    
    cycleRecords.forEach(record => {
      const version = record.versao || 1;
      versionsSet.add(version);
    });
    
    console.log(`Versões encontradas: ${Array.from(versionsSet).join(', ')}`);
    
    // Converter para array e formatar
    const rounds = Array.from(versionsSet).map(version => ({
      version: typeof version === 'string' ? parseInt(version, 10) : version,
      cycleId,
      cycleName
    }));
    
    // Ordenar por versão
    rounds.sort((a, b) => a.version - b.version);
    
    console.log(`Rodadas formatadas: ${rounds.length}`);
    return rounds;
  } catch (error) {
    console.error('Erro completo ao detectar rodadas do ciclo:', error);
    
    if (error.response) {
      console.error('Erro de resposta:', error.response.status, error.response.statusText);
      console.error('Dados do erro:', error.response.data);
    } else if (error.request) {
      console.error('Sem resposta do servidor:', error.request);
    }
    
    throw error;
  }
};

/**
 * Mescla um ciclo com suas metas locais
 * @param {Object} cycle - Ciclo a ser mesclado
 * @returns {Object} - Ciclo com suas metas
 */
const mergeCycleWithLocalGoals = (cycle) => {
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
const calculateProgress = (records, subjectId, version, targetTime) => {
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
const saveLocalGoals = (newGoals) => {
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

module.exports = {
  fetchCyclesFromAPI,
  mapCycleData,
  detectCycleRounds,
  mergeCycleWithLocalGoals,
  calculateProgress,
  saveLocalGoals
};