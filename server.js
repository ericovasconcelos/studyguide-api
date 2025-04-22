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
const studyRoutes = require('./server/studies');
const fixStaticServing = require('./fix-static-serving');

// Try to require the TypeScript compiled granToken routes with a fallback
let granTokenRoutes;
try {
  const granTokenModule = require('./dist/routes/granToken');
  // Handle both ESM and CommonJS default exports
  granTokenRoutes = granTokenModule.default || granTokenModule;
  console.log('[INFO] Successfully loaded granToken routes from TypeScript build');
} catch (error) {
  console.error('[ERROR] Failed to load TypeScript granToken routes:', error.message);
  console.error('[ERROR] Please run "npm run build:backend" before starting the server');
  console.error('[ERROR] Exiting...');
  process.exit(1);
}

// Try to require the TypeScript compiled user routes
let userRoutes;
try {
  const userModule = require('./dist/routes/user');
  // Handle both ESM and CommonJS default exports
  userRoutes = userModule.default || userModule;
  console.log('[INFO] Successfully loaded user routes from TypeScript build');
} catch (error) {
  console.error('[ERROR] Failed to load TypeScript user routes:', error.message);
  console.error('[ERROR] User management will not be available');
  // Continue without user routes
}

// Try to require the TypeScript compiled auth routes
let authRoutes;
try {
  const authModule = require('./dist/routes/auth');
  // Handle both ESM and CommonJS default exports
  authRoutes = authModule.default || authModule;
  console.log('[INFO] Successfully loaded auth routes from TypeScript build');
} catch (error) {
  console.error('[ERROR] Failed to load TypeScript auth routes:', error.message);
  console.error('[ERROR] Authentication will not be available');
  // Continue without auth routes
}

// Importando as funções para gerar dados simulados
const { 
  generateMockData,
  generateRawMockResponse 
} = require('./mockDataGenerator');

// Configuração da aplicação
const app = express();
const PORT = process.env.PORT || 3001;

// Versão da API
const API_VERSION = '1.0.0';

// Configuração CORS
const corsOptions = {
  origin: '*', // Temporariamente aceitar todas as origens para diagnóstico
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true
};

// Middleware - importante: o CORS deve vir ANTES de qualquer outro middleware
app.use(cors(corsOptions));

// Depois os outros middlewares
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// O fixStaticServing deve vir DEPOIS do CORS e outros middlewares essenciais
app.use(fixStaticServing);

// Tokens para teste local
const validTokens = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo', // Token de demonstração
  'test-token-1234'                             // Token de teste
];

// Configuração da API
const API_URL = process.env.API_URL || 'http://localhost:3000';

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
app.use('/api/studies', studyRoutes);

// Only add user routes if they were successfully loaded
if (userRoutes) {
  app.use('/api/users', userRoutes);
  console.log('[INFO] User routes enabled at /api/users');
  
  // Adiciona as rotas de grantoken sob o caminho /api/users/:userId/grantoken
  if (granTokenRoutes) {
    // Criar um roteador específico para as rotas grantoken associadas a um usuário
    const granTokenUserRouter = express.Router({ mergeParams: true });
    granTokenUserRouter.get('/', async (req, res) => {
      req.params.userId = req.params.userId; // Garantir que userId seja passado
      const controller = require('./dist/controllers/GranTokenController').GranTokenController;
      const repository = require('./dist/infrastructure/repositories/MongoUserRepository').MongoUserRepository;
      const userRepo = new repository();
      const granTokenController = new controller(userRepo);
      await granTokenController.getToken(req, res);
    });
    
    granTokenUserRouter.post('/', async (req, res) => {
      req.params.userId = req.params.userId; // Garantir que userId seja passado
      const controller = require('./dist/controllers/GranTokenController').GranTokenController;
      const repository = require('./dist/infrastructure/repositories/MongoUserRepository').MongoUserRepository;
      const userRepo = new repository();
      const granTokenController = new controller(userRepo);
      await granTokenController.saveToken(req, res);
    });
    
    granTokenUserRouter.delete('/', async (req, res) => {
      req.params.userId = req.params.userId; // Garantir que userId seja passado
      const controller = require('./dist/controllers/GranTokenController').GranTokenController;
      const repository = require('./dist/infrastructure/repositories/MongoUserRepository').MongoUserRepository;
      const userRepo = new repository();
      const granTokenController = new controller(userRepo);
      await granTokenController.clearToken(req, res);
    });
    
    app.use('/api/users/:userId/grantoken', granTokenUserRouter);
    console.log('[INFO] Gran token routes enabled at /api/users/:userId/grantoken');
  }
}

// Only add auth routes if they were successfully loaded
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('[INFO] Authentication enabled at /api/auth');
}

// Manter a rota antiga por um tempo para compatibilidade
if (granTokenRoutes) {
  app.use('/api/gran-token', granTokenRoutes);
  console.log('[INFO] Gran token routes also available at /api/gran-token (deprecated)');
}

// Endpoint para verificar a conexão com a API
app.get('/api/health', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    res.json(response.data);
  } catch (error) {
    console.error('[ERROR] Falha ao conectar com a API:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com a API',
      error: error.message
    });
  }
});

// Endpoint para explorar a API
app.get('/api/explore', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/explore`);
    res.json(response.data);
  } catch (error) {
    console.error('[ERROR] Falha ao explorar a API:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Falha ao explorar a API',
      error: error.message
    });
  }
});

// Endpoint para diagnóstico da API
app.get('/api/diagnostic', async (req, res) => {
  try {
    console.log('[DIAGNOSTIC] Iniciando diagnóstico da API');
    
    const response = await axios.get(`${API_URL}/health`);
    res.json({
      status: 'success',
      message: 'Conexão com a API estabelecida com sucesso',
      data: response.data
    });
  } catch (error) {
    console.error('[ERROR] Falha no diagnóstico:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Falha ao conectar com a API',
      error: error.message
    });
  }
});

// Função auxiliar para logar erros da API
function logApiError(error, context) {
  console.error(`[ERROR] ${context}:`, error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  }
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
    // Tentar conectar à API para verificar disponibilidade
    const apiStatus = await axios.get(`${API_URL}/health`, {
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
      apiUrl: API_URL,
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
      api: apiStatus,
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
│ API: ${API_URL.substring(0, 35)}... │
└───────────────────────────────────────────┘
  `);
});