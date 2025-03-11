# Estratégia de Integração com API do Gran Cursos

## Visão Geral

Este documento descreve a estratégia para integrar o StudyGuide com a API do Gran Cursos, adotando uma abordagem híbrida que combina dados da API com funcionalidades locais.

## Arquitetura

Implementaremos uma integração híbrida que:

1. **Importa estruturas da API do Gran Cursos**:
   - Ciclos de estudo (`cicloId`, `cicloTexto`)
   - Versões/rodadas de ciclos (`versao`)
   - Disciplinas (`disciplinaId`, `disciplinaTexto`)
   - Registros de estudo (`tempoGasto`, `dataEstudo`, etc.)

2. **Mantém gestão local para metas de tempo**:
   - Metas de tempo por disciplina são definidas e armazenadas localmente
   - Estrutura de dados hierárquica: `cicloId/versao/disciplinaId/targetTime`
   - Persistência no localStorage para funcionamento offline

## Estratégia de Implementação

### Fase 1: Preparação e Testes (concluído)
- ✅ Análise da API existente
- ✅ Definição da estrutura de dados
- ✅ Criação de testes automatizados
- ✅ Implementação do módulo de integração base

### Fase 2: Integração com Ciclos
1. Integrar o módulo de ciclos existente com o novo sistema
2. Implementar detecção e importação de ciclos da API
3. Criar interface para definir metas de tempo para ciclos importados
4. Testes de integração para garantir funcionamento correto

### Fase 3: UI para Rodadas (Versões)
1. Atualizar o UI para incluir seletor de rodadas
2. Implementar filtragem por ciclo e rodada em componentes existentes
3. Manter compatibilidade com dados existentes

### Fase 4: Integração com o Dashboard
1. Atualizar cálculos de progresso para considerar ciclos e rodadas
2. Ajustar visualizações para mostrar dados por rodada
3. Implementar indicadores visuais de rodada atual vs. anteriores

## Estrutura de Dados

### Metas Locais (localStorage)
```javascript
{
  "847450": {                 // cicloId 
    "1": {                    // versão (rodada)
      "33": {                 // disciplinaId
        "targetTime": 600     // tempo alvo em minutos
      }
    },
    "2": { ... }              // outra versão (rodada)
  },
  "838585": { ... }           // outro ciclo
}
```

### Dados de Ciclo (da API)
```javascript
{
  id: 847450,                    // cicloId
  name: "teste2",                // cicloTexto
  startDate: "2025-02-15",       // dataInicio
  endDate: "2025-04-15",         // dataFim
  isActive: true,                // ativo
  isFromAPI: true                // indicador de origem
}
```

### Dados de Rodadas (calculado a partir dos registros)
```javascript
{
  version: 1,                    // versao
  cycleId: 847450,               // cicloId
  cycleName: "teste2"            // cicloTexto
}
```

## Testes

Implementamos testes automatizados que garantem:

1. **Busca e mapeamento de dados**:
   - Sucesso ao buscar ciclos da API
   - Conversão correta para o formato da aplicação
   - Detecção precisa de rodadas/versões

2. **Gerenciamento de metas**:
   - Mesclagem de ciclos com metas locais
   - Cálculo correto de progresso por rodada/disciplina
   - Persistência adequada de metas no localStorage

3. **Tratamento de erros**:
   - Fallback para dados locais quando a API falha
   - Validação de token adequada
   - Mensagens de erro claras e úteis

## Plano de Deploy

1. Implementar em ambiente de testes e validar com usuários internos
2. Deploy para produção usando estratégia de feature flag para habilitar gradualmente
3. Monitoramento de erros e feedback do usuário
4. Ajustes baseados no feedback

## Considerações de Segurança

- Tokens de API são armazenados apenas na sessão atual
- Não há envio de dados sensíveis para a API
- Todas as requisições API passam por HTTPS

## Garantias de Qualidade

- Testes automatizados executados antes de cada commit
- CI/CD verificando funcionamento da integração
- Fallbacks e tratamento de erros em todos os pontos de integração
- Retrocompatibilidade com dados existentes