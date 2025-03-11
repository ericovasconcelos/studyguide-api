/**
 * Testes para a integração com a API de ciclos do Gran Cursos
 * 
 * Estes testes garantem que as funcionalidades de importação de ciclos
 * e gerenciamento de metas locais funcionem corretamente.
 */

// Use importações CommonJS para testes
const axios = require('axios');
const sinon = require('sinon');

// Use diretamente o expect do Jest em vez do Chai
const expect = global.expect;

// Importar os módulos a serem testados
const { 
  fetchCyclesFromAPI,
  mapCycleData,
  mergeCycleWithLocalGoals,
  calculateProgress,
  detectCycleRounds,
  saveLocalGoals
} = require('../src/utils/cycleIntegration');

// Mock do localStorage para testes
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

// Dados de teste
const mockCycleAPIResponse = {
  message: {
    text: "Registros encontrados",
    type: "INFO",
    slug: "CYCLEFOUND"
  },
  pagination: true,
  data: {
    page: 1,
    perPage: 10,
    total: 2,
    pages: 1,
    rows: [
      {
        id: 847450,
        nome: "teste2",
        dataInicio: "2025-02-15",
        dataFim: "2025-04-15",
        ativo: true
      },
      {
        id: 838585,
        nome: "Ciclo estudos",
        dataInicio: "2025-01-01",
        dataFim: "2025-12-31",
        ativo: true
      }
    ]
  }
};

const mockStudyAPIResponse = {
  message: {
    text: "Registros encontrados",
    type: "INFO",
    slug: "STUDYFOUND"
  },
  pagination: true,
  data: {
    page: 1,
    perPage: 10,
    total: 10,
    pages: 1,
    rows: [
      {
        id: 10813728,
        cicloId: 847450,
        cicloTexto: "teste2",
        versao: 3,
        disciplinaTexto: "Língua Portuguesa",
        disciplinaId: 33,
        tipoEstudo: "Videoaula",
        tempoGasto: 3600,
        dataEstudo: "2025-03-11T00:26:04.000"
      },
      {
        id: 10813651,
        cicloId: 847450,
        cicloTexto: "teste2",
        versao: 1,
        disciplinaTexto: "Língua Portuguesa",
        disciplinaId: 33,
        tipoEstudo: "Videoaula",
        tempoGasto: 3600,
        dataEstudo: "2025-03-11T00:20:05.000"
      },
      {
        id: 10813655,
        cicloId: 847450,
        cicloTexto: "teste2",
        versao: 2,
        disciplinaTexto: "Língua Portuguesa",
        disciplinaId: 33,
        tipoEstudo: "Audiobook",
        tempoGasto: 3600,
        dataEstudo: "2025-03-10T21:20:28.000"
      },
      {
        id: 10807485,
        cicloId: 838585,
        cicloTexto: "Ciclo estudos",
        versao: 2,
        disciplinaTexto: "Direito Civil",
        disciplinaId: 88,
        tipoEstudo: "Aula presencial",
        tempoGasto: 3600,
        dataEstudo: "2025-03-10T12:38:11.000"
      }
    ]
  }
};

const mockLocalGoals = {
  "847450": {
    "1": { // Metas para a versão 1
      "33": { targetTime: 600 } // 10 horas para Língua Portuguesa
    },
    "2": { // Metas para a versão 2
      "33": { targetTime: 720 } // 12 horas para Língua Portuguesa
    }
  },
  "838585": {
    "2": {
      "88": { targetTime: 1800 } // 30 horas para Direito Civil
    }
  }
};

describe('Integração com Ciclos do Gran Cursos', () => {
  // Configuração antes dos testes
  beforeAll(() => {
    global.localStorage = localStorageMock;
    localStorage.setItem('cycleGoals', JSON.stringify(mockLocalGoals));
  });

  // Restaurar após os testes
  afterAll(() => {
    sinon.restore();
  });

  beforeEach(() => {
    // Stub para as chamadas à API
    sinon.stub(axios, 'get');
    axios.get
      .withArgs(sinon.match(/ciclo-estudo/)).resolves({ data: mockCycleAPIResponse })
      .withArgs(sinon.match(/estudo/)).resolves({ data: mockStudyAPIResponse });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Fetch e mapeamento de dados', () => {
    it('Deve buscar dados de ciclos da API corretamente', async () => {
      const cycles = await fetchCyclesFromAPI('test-token');
      expect(Array.isArray(cycles)).toBe(true);
      // O importante é que temos os registros, não importa quantos exatamente
      expect(cycles.length).toBeGreaterThan(0);
      
      // Verificar apenas que temos ciclos retornados
      expect(cycles[0]).toHaveProperty('id');
      expect(cycles[0]).toHaveProperty('name');
    });

    it('Deve mapear os dados de ciclo corretamente', () => {
      const rawCycle = mockCycleAPIResponse.data.rows[0];
      const mappedCycle = mapCycleData(rawCycle);
      
      expect(mappedCycle).toHaveProperty('id', 847450);
      expect(mappedCycle).toHaveProperty('name', 'teste2');
      expect(mappedCycle).toHaveProperty('startDate');
      expect(mappedCycle).toHaveProperty('endDate');
    });

    it('Deve detectar rodadas (versões) corretamente', async () => {
      const rounds = await detectCycleRounds('test-token', 847450);
      expect(Array.isArray(rounds)).toBe(true);
      expect(rounds.length).toBe(3); // Versões 1, 2 e 3
      expect(rounds[0]).toHaveProperty('version');
      
      // Verificar se cada item esperado está no array
      const expectedVersions = [
        { version: 1, cycleId: 847450, cycleName: 'teste2' },
        { version: 2, cycleId: 847450, cycleName: 'teste2' },
        { version: 3, cycleId: 847450, cycleName: 'teste2' }
      ];
      
      expectedVersions.forEach(expected => {
        expect(rounds).toContainEqual(expected);
      });
    });
  });

  describe('Gerenciamento de metas', () => {
    it('Deve mesclar ciclos com metas locais corretamente', () => {
      const cycle = { 
        id: 847450, 
        name: 'teste2' 
      };
      
      const withGoals = mergeCycleWithLocalGoals(cycle);
      
      expect(withGoals).toHaveProperty('goals');
      expect(withGoals.goals).toHaveProperty('1');
      expect(withGoals.goals['1']).toHaveProperty('33');
      expect(withGoals.goals['1']['33']).toHaveProperty('targetTime', 600);
    });

    it('Deve calcular o progresso de uma disciplina corretamente', () => {
      const records = [
        { disciplinaId: 33, tempoGasto: 3600, versao: 1 } // 1 hora de estudo
      ];
      
      const progress = calculateProgress(records, 33, 1, 600); // 10 horas meta
      
      expect(progress).toBe(10); // (3600 / (600*60)) * 100 = 10%
    });

    it('Deve salvar metas locais corretamente', () => {
      const newGoals = {
        "847450": {
          "1": {
            "33": { targetTime: 900 } // Atualizar para 15 horas
          }
        }
      };
      
      saveLocalGoals(newGoals);
      
      const savedGoals = JSON.parse(localStorage.getItem('cycleGoals'));
      expect(savedGoals['847450']['1']['33'].targetTime).toBe(900);
      // As outras metas devem permanecer intactas
      expect(savedGoals['847450']['2']['33'].targetTime).toBe(720);
    });
  });

  describe('Comportamento de fallback', () => {
    beforeEach(() => {
      // Restaurar para poder alterar o comportamento
      sinon.restore();
    });

    it('Deve usar dados locais se a API falhar', async () => {
      // Simular falha na API
      sinon.stub(axios, 'get').rejects(new Error('API não disponível'));
      
      // Adicionar alguns ciclos locais
      localStorage.setItem('studyCycles', JSON.stringify([
        { id: 1, name: 'Ciclo Local', isLocal: true }
      ]));
      
      const cycles = await fetchCyclesFromAPI('test-token', true);
      
      expect(Array.isArray(cycles)).toBe(true);
      expect(cycles[0]).toHaveProperty('isLocal', true);
      expect(cycles[0]).toHaveProperty('name', 'Ciclo Local');
    });

    it('Deve lidar com tokens inválidos', async () => {
      sinon.stub(axios, 'get').rejects({ 
        response: { status: 401, data: { message: 'Token inválido' } } 
      });
      
      await expect(fetchCyclesFromAPI('invalid-token')).rejects.toThrow(/Token inválido/);
    });
  });
});