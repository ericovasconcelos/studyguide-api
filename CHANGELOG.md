# Registro de Alterações (CHANGELOG)

## [Não Lançado] - 2025-03-11

### Adicionado
- Botão "Aplicar a Todas" para definir a mesma meta para todas as disciplinas de uma vez
- Scripts de teste automatizados (`test-all.sh` e `run-tests.sh`)
- Indicador do número de disciplinas disponíveis na interface
- Logs detalhados para facilitar diagnóstico de problemas
- Documentação de testes (TEST-README.md)

### Corrigido
- Correção do carregamento de disciplinas ao trocar de rodada
- Tratamento correto de IDs numéricos e strings nas comparações
- Ajuste na exibição de mensagens de carregamento

### Alterado
- Aumento do número de registros buscados de 100 para 500
- Melhoria no tratamento de erros em requisições à API
- Organização do código com funções definidas antes de seu uso
- Simplificação do fluxo de definição de metas

### Otimizado
- Redução de chamadas desnecessárias à API
- Extração eficiente de ciclos a partir de registros de estudo
- Implementação de feedback visual durante operações de carregamento

## [0.1.0] - 2025-02-15

### Adicionado
- Interface para gerenciamento de metas por ciclo/rodada
- Estratégia de integração com API do Gran Cursos
- Ferramenta para explorar a API do Gran Cursos
- Implementação de filtro por ciclo e rodadas