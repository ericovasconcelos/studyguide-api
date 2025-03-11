/**
 * Testes para a integração com a API de ciclos do Gran Cursos
 * 
 * Estes testes garantem que as funcionalidades de importação de ciclos
 * e gerenciamento de metas locais funcionem corretamente.
 */

const axios = require('axios');
const { expect } = require('chai');
const sinon = require('sinon');

// Importar os módulos a serem testados
// Nota: Estes módulos serão criados posteriormente
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
  before(() => {
    global.localStorage = localStorageMock;
    localStorage.setItem('cycleGoals', JSON.stringify(mockLocalGoals));
  });

  // Restaurar após os testes
  after(() => {
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
      expect(cycles).to.be.an('array');
      expect(cycles).to.have.lengthOf(2);
      expect(cycles[0]).to.have.property('id', 847450);
      expect(cycles[1]).to.have.property('id', 838585);
    });

    it('Deve mapear os dados de ciclo corretamente', () => {
      const rawCycle = mockCycleAPIResponse.data.rows[0];
      const mappedCycle = mapCycleData(rawCycle);
      
      expect(mappedCycle).to.have.property('id', 847450);
      expect(mappedCycle).to.have.property('name', 'teste2');
      expect(mappedCycle).to.have.property('startDate');
      expect(mappedCycle).to.have.property('endDate');
    });

    it('Deve detectar rodadas (versões) corretamente', async () => {
      const rounds = await detectCycleRounds('test-token', 847450);
      expect(rounds).to.be.an('array');
      expect(rounds).to.have.lengthOf(3); // Versões 1, 2 e 3
      expect(rounds[0]).to.have.property('version');
      expect(rounds).to.deep.include.members([
        { version: 1, cycleId: 847450, cycleName: 'teste2' },
        { version: 2, cycleId: 847450, cycleName: 'teste2' },
        { version: 3, cycleId: 847450, cycleName: 'teste2' }
      ]);
    });
  });

  describe('Gerenciamento de metas', () => {
    it('Deve mesclar ciclos com metas locais corretamente', () => {
      const cycle = { 
        id: 847450, 
        name: 'teste2' 
      };
      
      const withGoals = mergeCycleWithLocalGoals(cycle);
      
      expect(withGoals).to.have.property('goals');
      expect(withGoals.goals).to.have.property('1');
      expect(withGoals.goals['1']).to.have.property('33');
      expect(withGoals.goals['1']['33']).to.have.property('targetTime', 600);
    });

    it('Deve calcular o progresso de uma disciplina corretamente', () => {
      const records = [
        { disciplinaId: 33, tempoGasto: 3600, versao: 1 } // 1 hora de estudo
      ];
      
      const progress = calculateProgress(records, 33, 1, 600); // 10 horas meta
      
      expect(progress).to.equal(10); // (3600 / (600*60)) * 100 = 10%
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
      expect(savedGoals['847450']['1']['33'].targetTime).to.equal(900);
      // As outras metas devem permanecer intactas
      expect(savedGoals['847450']['2']['33'].targetTime).to.equal(720);
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
      
      expect(cycles).to.be.an('array');
      expect(cycles[0]).to.have.property('isLocal', true);
      expect(cycles[0]).to.have.property('name', 'Ciclo Local');
    });

    it('Deve lidar com tokens inválidos', async () => {
      sinon.stub(axios, 'get').rejects({ 
        response: { status: 401, data: { message: 'Token inválido' } } 
      });
      
      try {
        await fetchCyclesFromAPI('invalid-token');
        // Se não lançar exceção, o teste falha
        expect.fail('Deveria ter lançado uma exceção');
      } catch (error) {
        expect(error.message).to.include('Token inválido');
      }
    });
  });
});