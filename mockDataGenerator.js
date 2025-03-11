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
function generateMockRecord(index) {
  const today = new Date();
  const randomDaysAgo = Math.floor(Math.random() * 30);
  const date = new Date();
  date.setDate(today.getDate() - randomDaysAgo);
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
  
  const formattedDate = date.toISOString().replace('Z', '').replace('T', ' ');
  
  const tempoGasto = Math.floor(Math.random() * 10800) + 1800; // Entre 30min e 3h30 (em segundos)
  const totalQuestao = Math.random() > 0.3 ? Math.floor(Math.random() * 50) + 5 : null;
  const totalAcerto = totalQuestao ? Math.floor(Math.random() * totalQuestao) : null;
  const tipoEstudo = STUDY_TYPES[Math.floor(Math.random() * STUDY_TYPES.length)];
  const periodo = STUDY_PERIODS[Math.floor(Math.random() * STUDY_PERIODS.length)];
  const disciplina = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const ciclo = CICLOS[Math.floor(Math.random() * CICLOS.length)];
  
  // Definir pontos de parada apenas para certos tipos de estudo
  const pontoParada = tipoEstudo === "Teoria" ? `Capítulo ${Math.floor(Math.random() * 10) + 1}` : "";
  
  // Simular a versão do ciclo (rodada) baseado na data
  // Dividimos os registros em 3 rodadas temporais
  const dayOfMonth = date.getDate();
  let versao = 1;
  
  // Registros mais antigos são da rodada 1, registros no meio são rodada 2, registros recentes são rodada 3
  if (dayOfMonth > 10 && dayOfMonth <= 20) {
    versao = 2;
  } else if (dayOfMonth > 20) {
    versao = 3;
  }
  
  return {
    id: 10800000 + index,
    tempoGasto: tempoGasto,
    tempoPausa: Math.floor(Math.random() * 300),
    dataEstudo: formattedDate,
    dataCriacao: formattedDate,
    dataAtualizacao: null,
    tipoEstudo: tipoEstudo,
    totalQuestao: totalQuestao,
    totalAcerto: totalAcerto,
    qtdPagina: Math.random() > 0.5 ? Math.floor(Math.random() * 30) : null,
    assuntoTexto: null,
    assuntoId: null,
    pontoParada: pontoParada,
    disciplinaTexto: disciplina.texto,
    disciplinaId: disciplina.id,
    cicloId: ciclo.id,
    periodoId: periodo.id,
    periodoTexto: periodo.texto,
    cicloAutomatizadoId: Math.floor(Math.random() * 100000) + 12000000,
    revisaoId: null,
    usuarioId: 623909,
    cicloTexto: ciclo.texto,
    versao: versao  // Adicionando o campo versao para simular as rodadas
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
    records.push(generateMockRecord(startId + i + 1));
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
    const tempoEstudo = record.tempoGasto || 0;
    const hours = Math.floor(tempoEstudo / 3600);
    const minutes = Math.floor((tempoEstudo % 3600) / 60);
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return {
      id: record.id || `rec-${Date.now()}`,
      date: record.dataEstudo || new Date().toISOString(),
      subject: record.disciplinaTexto || 'Desconhecido',
      studyTime: formattedTime,
      totalExercises: record.totalQuestao || 0,
      correctAnswers: record.totalAcerto || 0,
      studyType: record.tipoEstudo || 'Desconhecido',
      studyPeriod: record.periodoTexto || 'Desconhecido',
      cycle: record.cicloTexto || '',
      cycleId: record.cicloId || 0,
      version: record.versao || 1  // Adicionando o campo version que vem do campo versao
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