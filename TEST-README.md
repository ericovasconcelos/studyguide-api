# Guia de Testes do StudyGuide

Este documento descreve os testes automatizados disponíveis no projeto e como executá-los.

## Scripts de Teste

O projeto inclui dois scripts para facilitar a execução de testes:

1. **test-all.sh** - Script automatizado que executa todos os testes
2. **run-tests.sh** - Script interativo com menu para escolher quais testes executar

### Executando os testes

```bash
# Para executar todos os testes automaticamente
./test-all.sh

# Para abrir menu interativo de testes
./run-tests.sh
```

## Tipos de Testes

O projeto possui três tipos de testes:

### 1. Testes de Componentes React

Testam os componentes React individualmente, verificando:
- Renderização correta
- Comportamento esperado da interface
- Interações do usuário

### 2. Testes de Integração

Testam a integração com a API do Gran Cursos e o módulo cycleIntegration:
- Busca de ciclos
- Detecção de rodadas
- Mapeamento de dados
- Gerenciamento de metas locais
- Comportamentos de fallback

### 3. Testes de API

Testam os endpoints da API local:
- Geração de dados simulados
- Verificação de token
- Busca de dados
- Formato das respostas

## Requisitos

- Node.js 18.x
- Servidor local rodando para testes de API
- Dependências instaladas (`npm install`)

## Dicas de Depuração

- Verifique os logs no console para mensagens de erro
- O servidor deve estar rodando para os testes de API passarem
- Use `npm test -- --watchAll=false --testNamePattern="nome do teste"` para executar testes específicos

## Manutenção

Ao adicionar novas funcionalidades, não se esqueça de:
1. Criar testes para as novas funcionalidades
2. Verificar se os testes existentes ainda passam
3. Atualizar a documentação se necessário