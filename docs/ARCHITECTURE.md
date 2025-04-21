# StudyGuide Architecture

## Overview
StudyGuide é uma aplicação web para gerenciamento de estudos, construída seguindo os princípios de Clean Architecture e Domain-Driven Design (DDD). O sistema é organizado em camadas bem definidas, cada uma com responsabilidades específicas.

## Camadas da Arquitetura

### 1. Domain Layer
- **Entities**: Classes que representam os conceitos principais do domínio
  - `Study`: Representa uma sessão de estudo com propriedades como data, assunto, tópico e duração
  - `User`: Representa um usuário do sistema com suas credenciais e permissões
- **Value Objects**: Objetos imutáveis que representam conceitos do domínio
  - `Duration`: Representa a duração de um estudo em minutos
  - `DateRange`: Representa um intervalo de datas
- **Repositories**: Interfaces que definem as operações de persistência
  - `IStudyRepository`: Define operações CRUD para estudos
  - `IUserRepository`: Define operações para usuários
- **Services**: Lógica de negócio do domínio
  - `ImportService`: Gerencia a importação de estudos
  - `AuthService`: Gerencia autenticação e autorização
- **Result Pattern**: Sistema de tratamento de resultados
  - **Result**: Classe base para operações que podem falhar
  - **Encapsula o sucesso ou falha de uma operação**
  - `Result<T>`: Tipo genérico para representar o resultado de qualquer operação com tipo T
  - `Result.ok(value)`: Cria um resultado bem-sucedido com valor opcional
  - `Result.fail(error)`: Cria um resultado com erro (string)
  - `result.isSuccessful()` ou `result.succeeded()`: Verifica se o resultado foi bem-sucedido
  - `result.failed()`: Verifica se o resultado falhou
  - `result.getValue()`: Retorna o valor se bem-sucedido (lança exceção se falha)
  - `result.getError()`: Retorna a mensagem de erro se falha (lança exceção se sucesso)
  - **Convenção do Projeto**: Todas as operações que podem falhar devem retornar `Result<T>` para consistência, incluindo em todas as interfaces e implementações

### 2. Application Layer
- **Use Cases**: Casos de uso da aplicação
  - `ImportStudiesUseCase`: Gerencia a importação de estudos
  - `CreateStudyUseCase`: Cria novos estudos
  - `GetStudiesUseCase`: Recupera estudos com filtros
  - `ImportGranStudiesUseCase`: Importa estudos do Gran Cursos
- **DTOs**: Objetos de transferência de dados
  - `StudyDTO`: Representa um estudo para transferência
  - `UserDTO`: Representa um usuário para transferência
  - `ImportResultDTO`: Resultado de operações de importação

### 3. Infrastructure Layer
- **Adapters**: Implementações concretas das interfaces do domínio
  - `StorageAdapter`: Interface para persistência de dados
  - `LocalStorageAdapter`: Implementação usando localStorage
  - `IndexedDBAdapter`: Implementação usando IndexedDB
  - `ServerSyncAdapter`: Implementação para sincronização com servidor
  - `CompositeAdapter`: Combina múltiplos adaptadores com cache e sincronização
  - `GranImportAdapter`: Adaptador para importação do Gran Cursos
- **Repositories**: Implementações concretas dos repositórios
  - `StudyRepository`: Implementação do IStudyRepository
  - `MongoStudyRepository`: Implementação usando MongoDB
- **Models**: Modelos de dados para persistência
  - `StudyModel`: Modelo MongoDB para estudos

### 4. Presentation Layer
- **Controllers**: Controladores da API REST
  - `StudyController`: Endpoints para estudos
  - `AuthController`: Endpoints para autenticação
  - `ImportController`: Endpoints para importação
- **Middleware**: Middleware para requisições HTTP
  - `AuthMiddleware`: Autenticação e autorização
  - `ValidationMiddleware`: Validação de dados
  - `RateLimitMiddleware`: Limitação de requisições
- **Hooks**: Hooks React para gerenciamento de estado
  - `useStudies`: Gerencia estudos no frontend
  - `useAuth`: Gerencia autenticação no frontend
  - `useData`: Gerencia dados e sincronização
  - `useImport`: Gerencia importação de dados

## Fluxo de Dados

1. **Requisição HTTP**
   - Middleware de autenticação valida o token JWT
   - Middleware de validação sanitiza e valida os dados
   - Middleware de rate limiting controla o número de requisições

2. **Lógica de Negócio**
   - Controller recebe a requisição e extrai os dados
   - Use Case executa a lógica de negócio
   - Service coordena operações complexas
   - Result Pattern garante tratamento adequado de erros

3. **Persistência**
   - Repository recebe os dados do Use Case
   - Adapter persiste os dados no armazenamento apropriado
   - Model mapeia os dados para o formato de armazenamento
   - CompositeAdapter gerencia cache e sincronização

4. **Resposta**
   - Controller formata a resposta
   - Middleware adiciona headers necessários
   - Cliente recebe a resposta formatada

## Segurança

1. **Autenticação**
   - Tokens JWT para autenticação
   - Senhas hasheadas com bcrypt
   - Tokens expiram após 24 horas
   - Refresh tokens para renovação

2. **Autorização**
   - Middleware de autorização baseado em roles
   - Controle de acesso granular
   - Validação de permissões em cada endpoint
   - Proteção contra CSRF

3. **Validação**
   - Sanitização de inputs
   - Validação de tipos e formatos
   - Proteção contra injeção de código
   - Validação de dados do Gran Cursos

4. **Rate Limiting**
   - Limite de 100 requisições por 15 minutos para API
   - Limite de 5 tentativas de login por hora
   - Limite de 10 importações por hora
   - Limite de 1 importação do Gran por hora

## Tratamento de Erros

1. **Erros de Domínio**
   - Result pattern para operações que podem falhar
   - Erros específicos do domínio
   - Mensagens de erro claras e localizadas
   - Stack traces em ambiente de desenvolvimento

2. **Erros de Infraestrutura**
   - Logging estruturado
   - Retry policies para operações de rede
   - Fallback para armazenamento local
   - Circuit breaker para serviços externos

3. **Erros de Validação**
   - Mensagens de erro detalhadas
   - Validação em múltiplas camadas
   - Feedback imediato para o usuário
   - Validação assíncrona quando necessário

## Logging

1. **Estrutura**
   - Logs estruturados em JSON
   - Contexto para cada operação
   - Níveis de log apropriados
   - Rotação de logs

2. **Informação**
   - Timestamp e ID da requisição
   - Usuário e ação realizada
   - Dados relevantes do contexto
   - Performance metrics

## Testes

1. **Testes de Domínio**
   - Testes unitários para entidades
   - Testes para value objects
   - Testes para serviços do domínio
   - Testes para o Result pattern

2. **Testes de Aplicação**
   - Testes de integração para use cases
   - Testes para controllers
   - Testes para middleware
   - Testes para adaptadores

3. **Testes E2E**
   - Testes de fluxos completos
   - Testes de integração com serviços externos
   - Testes de performance
   - Testes de sincronização 