require('dotenv').config();

/**
 * Servidor API para StudyGuide
 * 
 * Este servidor funciona como um proxy entre o frontend e a API do Gran Cursos.
 * Ele fornece endpoints para:
 * - Verificar tokens JWT
 * - Buscar dados de estudo do Gran Cursos
 * - Gerar dados simulados para desenvolvimento
 * - Monitorar o status do sistema
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
const compression = require('compression');
const syncRoutes = require('./server/sync');

// Importando as funções para gerar dados simulados
const { 
  generateMockData,
  generateRawMockResponse 
} = require('./mockDataGenerator');

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 5000;

// Versão da API
const API_VERSION = '1.0.0';

// Configuração CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.RENDER_EXTERNAL_URL || 'https://studyguide-api.onrender.com'
    : ['http://localhost:3000', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Tokens para teste local
const validTokens = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo', // Token de demonstração
  'test-token-1234'                             // Token de teste
];

// Configuração da API do Gran Cursos
const GRAN_API_URL = 'https://bj4jvnteuk.execute-api.us-east-1.amazonaws.com/v1/estudo';
const DEFAULT_PER_PAGE = 100; // Configurado para buscar 100 registros por página

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB Connected');
}).catch(err => {
  console.error('MongoDB Connection Error:', err);
});

// Routes
app.use('/sync', syncRoutes);

// Endpoint para verificar se o token é válido
app.post('/verify-token', async (req, res) => {
  const { token } = req.body;
  
  // Verificar se o token está presente
  if (!token) {
    return res.status(401).json({
      valid: false,
      error: 'Token não fornecido'
    });
  }
  
  // Se for um token de teste, retornar válido
  if (validTokens.includes(token)) {
    return res.json({
      valid: true,
      message: 'Token de teste válido',
      isMockToken: true
    });
  }
  
  try {
    // Tentar fazer uma requisição com o token para validar
    const response = await axios.get(`${GRAN_API_URL}?page=1&perPage=1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 segundos de timeout para verificação
    });
    
    // Se a requisição foi bem-sucedida, o token é válido
    res.json({
      valid: true,
      message: 'Token válido para a API do Gran Cursos',
      totalItems: response.data?.totalItems || 0
    });
    
  } catch (error) {
    console.error('Erro ao verificar token:', error.message);
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      return res.status(401).json({
        valid: false,
        error: 'Token inválido ou expirado'
      });
    }
    
    // Outros erros de conexão
    res.status(500).json({
      valid: false,
      error: 'Erro ao verificar token',
      details: error.message
    });
  }
});

// Endpoint para explorar a API do Gran Cursos
app.post('/explore-api', async (req, res) => {
  const { token, endpoint = 'estudo', params = {} } = req.body;
  
  // Verificar se o token está presente
  if (!token) {
    return res.status(401).json({
      error: 'Token não fornecido'
    });
  }
  
  try {
    // Construir a URL da API com base no endpoint e parâmetros
    let apiUrl = `https://bj4jvnteuk.execute-api.us-east-1.amazonaws.com/v1/${endpoint}`;
    
    // Adicionar parâmetros de consulta se existirem
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        queryParams.append(key, value);
      }
      apiUrl += `?${queryParams.toString()}`;
    }
    
    console.log(`Explorando API: ${apiUrl}`);
    
    // Fazer a requisição para a API do Gran Cursos
    const response = await axios.get(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 segundos de timeout
    });
    
    // Retornar os dados para análise
    res.json({
      success: true,
      endpoint,
      params,
      data: response.data,
      structure: {
        keys: Object.keys(response.data || {}),
        dataType: typeof response.data,
        hasData: response.data?.data ? true : false,
        dataKeys: response.data?.data ? Object.keys(response.data.data) : [],
        sampleData: response.data?.data?.rows ? response.data.data.rows.slice(0, 2) : null
      }
    });
    
  } catch (error) {
    console.error(`Erro ao explorar API (${endpoint}):`, error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      response: error.response?.data || null,
      endpoint,
      params
    });
  }
});

// Endpoint para buscar dados do Gran Cursos
app.post('/fetch-gran-data', async (req, res) => {
  const { token } = req.body;
  const useRealAPI = req.body.useRealAPI !== false; // Por padrão, usamos a API real exceto se especificado o contrário

  // Verificar se o token está presente
  if (!token) {
    return res.status(401).json({
      error: 'Token não fornecido'
    });
  }

  // Se for um token de teste, retornar dados simulados
  if (validTokens.includes(token)) {
    console.log('Usando dados simulados para token de teste');
    
    // Verifica se o cliente quer dados brutos (para teste) ou processados (formato frontend)
    const rawMockData = req.body.rawFormat === true;
    
    // Simular latência da rede (300-1500ms)
    setTimeout(() => {
      if (rawMockData) {
        // Retorna dados no formato bruto da API do Gran Cursos (para testes)
        const page = req.body.page || 1;
        const perPage = req.body.perPage || 100;
        const mockResponse = generateRawMockResponse(page, perPage);
        res.json(mockResponse);
      } else {
        // Retorna dados no formato processado para o frontend
        const data = generateMockData();
        res.json(data);
      }
    }, Math.floor(Math.random() * 1200) + 300);
    
    return;
  }

  try {
    console.log('Conectando-se à API do Gran Cursos...');
    
    // Função para buscar uma página de dados
    async function fetchPage(pageNum) {
      console.log(`Buscando página ${pageNum}...`);
      return axios.get(`${GRAN_API_URL}?page=${pageNum}&perPage=${DEFAULT_PER_PAGE}&sort=desc`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 segundos de timeout
      });
    }

    // Buscar a primeira página para obter o total de registros
    const firstPageResponse = await fetchPage(1);
    
    // Verificar e processar a resposta da API do Gran Cursos
    if (!firstPageResponse.data) {
      throw new Error('Resposta vazia da API do Gran Cursos');
    }
    
    console.log('Estrutura da resposta:', JSON.stringify(Object.keys(firstPageResponse.data)));
    
    // Verificar se é o formato esperado da API do Gran Cursos
    if (firstPageResponse.data.data && firstPageResponse.data.data.rows) {
      console.log('Formato Gran Cursos detectado');
      
      // Extrair registros da primeira página
      let allRecords = [...firstPageResponse.data.data.rows];
      const totalRecords = firstPageResponse.data.data.total || allRecords.length;
      const totalPages = firstPageResponse.data.data.pages || Math.ceil(totalRecords / DEFAULT_PER_PAGE);
      
      console.log(`Total de ${totalRecords} registros em ${totalPages} páginas`);
      
      // Se houver mais páginas, buscar as demais (limitamos a 10 páginas para evitar sobrecarga)
      const maxPages = Math.min(totalPages, 10);
      
      if (maxPages > 1) {
        const pagePromises = [];
        
        // Criar promises para buscar as páginas adicionais (começando da página 2)
        for (let page = 2; page <= maxPages; page++) {
          pagePromises.push(fetchPage(page));
        }
        
        // Executar todas as requisições em paralelo
        const pageResponses = await Promise.all(pagePromises);
        
        // Adicionar os registros de cada página ao array de todos os registros
        pageResponses.forEach(response => {
          if (response.data && response.data.data && response.data.data.rows) {
            allRecords = [...allRecords, ...response.data.data.rows];
          }
        });
      }
      
      console.log(`Total de ${allRecords.length} registros recuperados`);
      
      // Processar os registros para o formato esperado pelo frontend
      const studyRecords = allRecords.map(record => {
        // Converter o tempo de estudo (segundos) para o formato HH:MM esperado pelo frontend
        const tempoEstudo = record.tempoGasto || 0;
        const hours = Math.floor(tempoEstudo / 3600);
        const minutes = Math.floor((tempoEstudo % 3600) / 60);
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Extrair somente a data do timestamp completo
        const dataEstudo = record.dataEstudo || new Date().toISOString();
        
        // Mapear os campos da API para o formato esperado pelo frontend
        return {
          id: record.id || `gc-${Date.now()}`,
          date: dataEstudo,
          subject: record.disciplinaTexto || 'Desconhecido',
          studyTime: formattedTime, // Formato HH:MM que o frontend espera
          totalExercises: record.totalQuestao || 0,
          correctAnswers: record.totalAcerto || 0,
          studyType: record.tipoEstudo || 'Desconhecido',
          studyPeriod: record.periodoTexto || 'Desconhecido',
          cycle: record.cicloTexto || '',
          cycleId: record.cicloId || 0,
          version: record.versao || 1  // Adicionando o campo versao do Gran Cursos
        };
      });
      
      // Enviar os dados processados
      res.json({
        studyRecords,
        totalCount: studyRecords.length,
        source: "Gran Cursos API",
        rawTotal: totalRecords
      });
      return;
    }
    
    // Se chegou aqui, a resposta não está no formato esperado
    console.log('Formato de resposta desconhecido:', JSON.stringify(firstPageResponse.data).substring(0, 200) + '...');
    throw new Error('Formato de resposta desconhecido da API do Gran Cursos');
    
  } catch (error) {
    console.error('Erro ao buscar dados do Gran Cursos:', error.message);
    
    // Verificar tipo de erro para retornar mensagem adequada
    if (error.response) {
      // Erro com resposta do servidor
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        return res.status(status).json({
          error: 'Token de autenticação inválido ou expirado',
          details: error.message
        });
      }
      
      return res.status(status).json({
        error: `Erro na API do Gran Cursos: ${status}`,
        details: error.message
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout na requisição
      return res.status(504).json({
        error: 'Timeout ao conectar com a API do Gran Cursos',
        details: 'A requisição excedeu o tempo limite'
      });
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      // Erro de conexão
      return res.status(502).json({
        error: 'Não foi possível conectar à API do Gran Cursos',
        details: error.message
      });
    }
    
    // Fallback para dados simulados em caso de erro
    console.log('Usando dados simulados como fallback devido a erro na API');
    const data = generateMockData();
    
    // Adicionar informação sobre o fallback
    data.isSimulatedFallback = true;
    data.errorDetails = error.message;
    
    res.json(data);
  }
});

// Rota padrão para servir o React em produção
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Endpoint para simular a API do Gran Cursos (para desenvolvimento e testes)
app.get('/mock-gran-api', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;
  
  const mockResponse = generateRawMockResponse(page, perPage);
  res.json(mockResponse);
});

// Endpoint de status e diagnóstico do servidor
app.get('/status', async (req, res) => {
  try {
    // Tentar conectar à API do Gran Cursos para verificar disponibilidade
    const apiStatus = await axios.get(`${GRAN_API_URL}?page=1&perPage=1`, {
      timeout: 3000,
      validateStatus: () => true // Não lançar exceções para códigos de status HTTP
    }).then(response => ({
      available: response.status >= 200 && response.status < 500,
      status: response.status,
      statusText: response.statusText
    })).catch(error => ({
      available: false,
      error: error.message
    }));
    
    // Informações sobre o servidor
    const serverInfo = {
      apiVersion: API_VERSION,
      startTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      granApiUrl: GRAN_API_URL,
      defaultPerPage: DEFAULT_PER_PAGE,
      endpoints: [
        { path: '/status', method: 'GET', description: 'Verifica status do servidor' },
        { path: '/verify-token', method: 'POST', description: 'Verifica se um token JWT é válido' },
        { path: '/fetch-gran-data', method: 'POST', description: 'Busca dados de estudo do Gran Cursos' },
        { path: '/mock-gran-api', method: 'GET', description: 'Simula a API do Gran Cursos (para testes)' }
      ]
    };
    
    res.json({
      status: 'ok',
      server: serverInfo,
      granApi: apiStatus,
      testTokens: validTokens.map(token => ({token, type: 'test'})),
      endpoints: [
        { path: '/status', method: 'GET', description: 'Verifica status do servidor' },
        { path: '/verify-token', method: 'POST', description: 'Verifica se um token JWT é válido' },
        { path: '/fetch-gran-data', method: 'POST', description: 'Busca dados de estudo do Gran Cursos' }
      ]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao verificar status do servidor',
      error: error.message
    });
  }
});

app.post('/api/studies/import', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }

    let studyRecords;
    
    if (token === 'test-token') {
      // Usar dados simulados para teste
      studyRecords = generateMockData();
    } else {
      // Buscar dados reais da API do Gran
      studyRecords = await fetchGranData(token);
    }

    // Converter para o novo formato
    const convertedRecords = studyRecords.map(record => ({
      id: record.id || `rec-${Date.now()}`,
      date: record.date || new Date().toISOString(),
      subject: record.subject || 'Desconhecido',
      timeSpent: typeof record.timeSpent === 'number' ? record.timeSpent : 0,
      questions: record.questions || 0,
      correctAnswers: record.correctAnswers || 0,
      source: record.source || 'Gran Cursos',
      topic: record.topic || '',
      notes: record.notes || '',
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: record.updatedAt || new Date().toISOString(),
      version: record.version || 1,
      cycleId: record.cycleId || null
    }));

    res.json({
      success: true,
      data: convertedRecords
    });
  } catch (error) {
    console.error('Erro ao importar estudos:', error);
    res.status(500).json({ error: 'Erro ao importar estudos' });
  }
});

/**
 * Inicia o servidor e exibe informações de inicialização
 */
app.listen(PORT, () => {
  console.log(`
┌───────────────────────────────────────────┐
│        StudyGuide API v${API_VERSION}                │
├───────────────────────────────────────────┤
│ Status: http://localhost:${PORT}/status          │
│                                           │
│ Tokens para testes:                       │
│ - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo    │
│ - test-token-1234                         │
├───────────────────────────────────────────┤
│ Ambiente: ${process.env.NODE_ENV || 'development'}                   │
│ Gran API: ${GRAN_API_URL.substring(0, 35)}... │
└───────────────────────────────────────────┘
  `);
});