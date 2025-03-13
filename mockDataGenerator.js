/**
 * Gerador de dados simulados para a API local
 * Baseado na estrutura real da API do Gran Cursos
 */

// Definição de tipos de estudo baseado nos dados reais da API
const STUDY_TYPES = [
  "Teoria",
  "Exercícios", 
  "Revisão", 
  "Simulado",
  "Videoaula",
  "Aula presencial"
];

// Definição de períodos de estudo baseado nos dados reais
const STUDY_PERIODS = [
  { id: 1, texto: "Manhã" },
  { id: 2, texto: "Tarde" },
  { id: 3, texto: "Noite" }
];

// Definição de disciplinas baseado nos dados reais
const SUBJECTS = [
  { id: 41544, texto: "Processo Legislativo" },
  { id: 41545, texto: "Direito Constitucional" },
  { id: 41546, texto: "Direito Administrativo" },
  { id: 41547, texto: "Português" },
  { id: 41548, texto: "Raciocínio Lógico" },
  { id: 41549, texto: "Informática" },
  { id: 41550, texto: "Direito Penal" },
  { id: 41551, texto: "Matemática" },
  { id: 41552, texto: "História" },
  { id: 41553, texto: "Geografia" },
  { id: 41554, texto: "Contabilidade" },
  { id: 41555, texto: "Direito Civil" }
];

// Definição de ciclos de estudo
const CICLOS = [
  { id: 838585, texto: "Ciclo estudos" },
  { id: 838586, texto: "Revisão geral" },
  { id: 838587, texto: "" }
];

/**
 * Gera um registro de estudo no formato exato da API do Gran Cursos
 */
function generateMockRecord(id, date, subject, version = 1, cycleId = null) {
  const timeSpent = Math.floor(Math.random() * 180) + 30; // 30 a 210 minutos
  const questions = Math.floor(Math.random() * 50) + 10;
  const correctAnswers = Math.floor(Math.random() * (questions + 1));
  
  return {
    id: id.toString(),
    date: date.toISOString(),
    subject,
    timeSpent,
    questions,
    correctAnswers,
    source: 'Gran Cursos',
    topic: `Tópico ${Math.floor(Math.random() * 5) + 1}`,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version,
    cycleId
  };
}

/**
 * Gera uma resposta completa no formato exato da API do Gran Cursos
 */
function generateMockGranResponse(page = 1, perPage = 100) {
  // Determinar o total de registros (entre 40 e 60)
  const totalRecords = Math.floor(Math.random() * 20) + 40;
  
  // Calcular o número total de páginas
  const totalPages = Math.ceil(totalRecords / perPage);
  
  // Determinar quantos registros devem estar nesta página
  const thisPageCount = page < totalPages ? perPage : (totalRecords - (perPage * (page - 1)));
  
  // Gerar os registros para esta página
  const records = [];
  const startId = (page - 1) * perPage;
  
  for (let i = 0; i < thisPageCount; i++) {
    records.push(generateMockRecord(startId + i + 1, new Date(), SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]));
  }
  
  // Montar a resposta no formato exato da API
  return {
    message: {
      text: "Registros encontrados",
      type: "INFO",
      slug: "STUDYFOUND"
    },
    pagination: true,
    data: {
      page: page,
      perPage: perPage,
      total: totalRecords,
      pages: totalPages,
      rows: records
    }
  };
}

/**
 * Gera dados simulados no formato antigo usado pelo frontend
 */
function generateMockData() {
  // Obter a resposta no formato da API Gran Cursos
  const apiResponse = generateMockGranResponse();
  
  // Processar para o formato esperado pelo frontend
  const studyRecords = apiResponse.data.rows.map(record => {
    // Converter o tempo de estudo para o formato HH:MM
    const tempoEstudo = record.timeSpent || 0;
    const hours = Math.floor(tempoEstudo / 3600);
    const minutes = Math.floor((tempoEstudo % 3600) / 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      id: record.id || `rec-${Date.now()}`,
      date: record.date || new Date().toISOString(),
      subject: record.subject.texto || 'Desconhecido',
      studyTime: formattedTime,
      totalExercises: record.questions || 0,
      correctAnswers: record.correctAnswers || 0,
      studyType: record.source || 'Desconhecido',
      studyPeriod: record.source === 'Gran Cursos' ? STUDY_PERIODS[Math.floor(Math.random() * STUDY_PERIODS.length)].texto : 'Desconhecido',
      cycle: record.cycleId ? CICLOS[Math.floor(Math.random() * CICLOS.length)].texto : '',
      cycleId: record.cycleId || 0,
      version: record.version || 1
    };
  });
  
  return {
    studyRecords,
    totalCount: studyRecords.length,
    source: "API Local - Gran Cursos Simulação"
  };
}

/**
 * Gera uma resposta simulada no formato bruto da API
 */
function generateRawMockResponse(page = 1, perPage = 100) {
  return generateMockGranResponse(page, perPage);
}

module.exports = {
  generateMockData,
  generateRawMockResponse,
  generateMockRecord,
  generateMockGranResponse
};