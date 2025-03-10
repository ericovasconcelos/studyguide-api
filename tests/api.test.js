/**
 * Testes para a API local do StudyGuide
 * 
 * Estes testes verificam se a API local funciona corretamente,
 * validando tanto o processamento de dados simulados quanto a
 * integração com a API real do Gran Cursos.
 * 
 * Para executar os testes:
 * npm test
 */

const axios = require('axios');
const { 
  generateMockData, 
  generateRawMockResponse 
} = require('../mockDataGenerator');

// Definição de um esquema para validar os dados
const STUDY_RECORD_SCHEMA = {
  required: ['id', 'date', 'subject', 'studyTime'],
  validate: (record) => {
    if (!record.id) return { valid: false, error: 'ID ausente' };
    if (!record.date) return { valid: false, error: 'Data ausente' };
    if (!record.subject) return { valid: false, error: 'Disciplina ausente' };
    
    // Verificar se o tempo de estudo está no formato correto HH:MM
    if (!record.studyTime || !/^\d{1,2}:\d{2}$/.test(record.studyTime)) {
      return { valid: false, error: `Tempo de estudo inválido: ${record.studyTime}` };
    }
    
    return { valid: true };
  }
};

// URL da API local
const API_URL = 'http://localhost:5000';

// Token de teste válido
const TEST_TOKEN = 'test-token-1234';

/**
 * Função para validar a estrutura de um registro de estudo
 */
function validateStudyRecord(record) {
  return STUDY_RECORD_SCHEMA.validate(record);
}

/**
 * Testes para os dados simulados
 */
async function testMockData() {
  console.log('\n===== Testando gerador de dados simulados =====');
  
  // Testar o gerador de dados simulados
  try {
    const mockData = generateMockData();
    console.log(`Gerados ${mockData.totalCount} registros simulados`);
    
    if (!mockData.studyRecords || !Array.isArray(mockData.studyRecords)) {
      console.error('❌ studyRecords não é um array');
      return false;
    }
    
    if (mockData.studyRecords.length === 0) {
      console.error('❌ Nenhum registro simulado gerado');
      return false;
    }
    
    // Validar o primeiro registro
    const firstRecord = mockData.studyRecords[0];
    console.log('Primeiro registro:', JSON.stringify(firstRecord, null, 2));
    
    const validation = validateStudyRecord(firstRecord);
    if (!validation.valid) {
      console.error(`❌ Validação falhou: ${validation.error}`);
      return false;
    }
    
    console.log('✅ Dados simulados válidos');
    return true;
  } catch (error) {
    console.error('❌ Erro ao gerar dados simulados:', error);
    return false;
  }
}

/**
 * Testes para o formato da resposta bruta da API
 */
async function testApiResponseFormat() {
  console.log('\n===== Testando formato da resposta da API =====');
  
  try {
    // Gerar um mock no formato exato da API
    const mockResponse = generateRawMockResponse();
    
    // Verificar a estrutura da resposta
    if (!mockResponse.message || !mockResponse.data) {
      console.error('❌ Formato de resposta invalido');
      return false;
    }
    
    if (!mockResponse.data.rows || !Array.isArray(mockResponse.data.rows)) {
      console.error('❌ data.rows não é um array');
      return false;
    }
    
    console.log(`Formato da resposta contém ${mockResponse.data.rows.length} registros`);
    
    // Verificar o primeiro registro
    const firstRecord = mockResponse.data.rows[0];
    console.log('Primeiro registro bruto:', {
      id: firstRecord.id,
      dataEstudo: firstRecord.dataEstudo,
      disciplinaTexto: firstRecord.disciplinaTexto,
      tipoEstudo: firstRecord.tipoEstudo,
      tempoGasto: firstRecord.tempoGasto,
    });
    
    // Verificar campos obrigatórios
    if (!firstRecord.id) {
      console.error('❌ Campo ID ausente no registro bruto');
      return false;
    }
    
    if (!firstRecord.dataEstudo) {
      console.error('❌ Campo dataEstudo ausente no registro bruto');
      return false;
    }
    
    if (!firstRecord.disciplinaTexto) {
      console.error('❌ Campo disciplinaTexto ausente no registro bruto');
      return false;
    }
    
    console.log('✅ Formato da resposta da API válido');
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar formato da resposta:', error);
    return false;
  }
}

/**
 * Testes para o endpoint de verificação de token
 */
async function testTokenVerification() {
  console.log('\n===== Testando endpoint de verificação de token =====');
  
  try {
    // Testar com token válido
    const response = await axios.post(`${API_URL}/verify-token`, {
      token: TEST_TOKEN
    });
    
    if (!response.data || !response.data.valid) {
      console.error('❌ Token de teste não foi validado');
      return false;
    }
    
    console.log('Resposta de verificação:', response.data);
    console.log('✅ Endpoint de verificação de token funcionando');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar token:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    return false;
  }
}

/**
 * Testes para o endpoint de busca de dados
 */
async function testFetchData() {
  console.log('\n===== Testando endpoint de busca de dados =====');
  
  try {
    // Testar com token válido
    const response = await axios.post(`${API_URL}/fetch-gran-data`, {
      token: TEST_TOKEN
    });
    
    if (!response.data || !response.data.studyRecords) {
      console.error('❌ Dados não retornados corretamente');
      return false;
    }
    
    console.log(`Recebidos ${response.data.totalCount} registros`);
    
    // Validar o primeiro registro
    if (response.data.studyRecords.length > 0) {
      const firstRecord = response.data.studyRecords[0];
      console.log('Primeiro registro:', JSON.stringify(firstRecord, null, 2));
      
      const validation = validateStudyRecord(firstRecord);
      if (!validation.valid) {
        console.error(`❌ Validação falhou: ${validation.error}`);
        return false;
      }
    }
    
    console.log('✅ Endpoint de busca de dados funcionando');
    return true;
  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
    return false;
  }
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  console.log('🧪 Iniciando testes da API local\n');
  
  // Verificar se a API está rodando
  try {
    const status = await axios.get(`${API_URL}/status`);
    console.log('API respondendo:', status.data.status);
  } catch (error) {
    console.error('❌ API local não está respondendo. Verifique se o servidor está rodando.');
    process.exit(1);
  }
  
  // Executar todos os testes
  const mockDataTest = await testMockData();
  const formatTest = await testApiResponseFormat();
  const tokenTest = await testTokenVerification();
  const fetchTest = await testFetchData();
  
  // Reportar resultados
  console.log('\n===== Resultados dos testes =====');
  console.log(`Dados simulados: ${mockDataTest ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Formato da resposta: ${formatTest ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Verificação de token: ${tokenTest ? '✅ OK' : '❌ FALHA'}`);
  console.log(`Busca de dados: ${fetchTest ? '✅ OK' : '❌ FALHA'}`);
  
  const allPassed = mockDataTest && formatTest && tokenTest && fetchTest;
  console.log(`\nResultado final: ${allPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);
  
  return allPassed;
}

// Executar os testes quando o arquivo for executado diretamente
if (require.main === module) {
  runAllTests()
    .then(passed => {
      process.exit(passed ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro ao executar testes:', error);
      process.exit(1);
    });
}

// Exportar funções para uso em outros testes
module.exports = {
  validateStudyRecord,
  testMockData,
  testApiResponseFormat,
  testTokenVerification,
  testFetchData,
  runAllTests
};