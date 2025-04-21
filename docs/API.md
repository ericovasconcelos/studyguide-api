# StudyGuide API Documentation

## Autenticação

Todas as requisições à API (exceto login) devem incluir um token JWT no header `Authorization`:

```
Authorization: Bearer <token>
```

## Endpoints

### Estudos

#### Criar Estudo
```http
POST /api/studies
```

**Body:**
```json
{
  "subject": "Matemática",
  "topic": "Álgebra Linear",
  "date": "2024-04-21T10:00:00Z",
  "duration": 120,
  "notes": "Revisão de matrizes e determinantes"
}
```

**Resposta (200):**
```json
{
  "id": "123",
  "userId": "user123",
  "subject": "Matemática",
  "topic": "Álgebra Linear",
  "date": "2024-04-21T10:00:00Z",
  "duration": 120,
  "notes": "Revisão de matrizes e determinantes",
  "createdAt": "2024-04-21T10:00:00Z",
  "updatedAt": "2024-04-21T10:00:00Z"
}
```

#### Listar Estudos
```http
GET /api/studies
```

**Query Parameters:**
- `startDate`: Data inicial (ISO)
- `endDate`: Data final (ISO)
- `subject`: Filtro por assunto
- `topic`: Filtro por tópico

**Resposta (200):**
```json
[
  {
    "id": "123",
    "userId": "user123",
    "subject": "Matemática",
    "topic": "Álgebra Linear",
    "date": "2024-04-21T10:00:00Z",
    "duration": 120,
    "notes": "Revisão de matrizes e determinantes",
    "createdAt": "2024-04-21T10:00:00Z",
    "updatedAt": "2024-04-21T10:00:00Z"
  }
]
```

#### Importar Estudos
```http
POST /api/studies/import
```

**Body:**
```json
[
  {
    "subject": "Matemática",
    "topic": "Álgebra Linear",
    "date": "2024-04-21T10:00:00Z",
    "duration": 120,
    "notes": "Revisão de matrizes e determinantes"
  }
]
```

**Resposta (200):**
```json
{
  "imported": 1,
  "duplicates": 0,
  "errors": []
}
```

#### Importar do Gran Cursos
```http
POST /api/studies/import/gran
```

**Body:**
```json
{
  "username": "usuario",
  "password": "senha",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

**Resposta (200):**
```json
{
  "imported": 10,
  "duplicates": 2,
  "errors": [],
  "details": {
    "totalFound": 12,
    "skipped": 0,
    "failed": 0
  }
}
```

### Autenticação

#### Login
```http
POST /api/auth/login
```

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123",
    "email": "usuario@exemplo.com",
    "role": "user"
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Resposta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Respostas de Erro

### 400 Bad Request
```json
{
  "error": "Dados inválidos",
  "details": {
    "field": "mensagem de erro"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Não autorizado"
}
```

### 403 Forbidden
```json
{
  "error": "Acesso negado"
}
```

### 429 Too Many Requests
```json
{
  "error": "Muitas requisições, tente novamente mais tarde",
  "retryAfter": 3600
}
```

### 500 Internal Server Error
```json
{
  "error": "Erro interno do servidor",
  "code": "INTERNAL_ERROR",
  "details": "Mensagem detalhada do erro"
}
```

## Limites de Requisição

- API: 100 requisições por 15 minutos
- Login: 5 tentativas por hora
- Importação: 10 importações por hora
- Importação do Gran: 1 importação por hora

## Validação de Dados

### Estudo
- `subject`: String, obrigatório
- `topic`: String, obrigatório
- `date`: Data, obrigatório, não pode ser futura
- `duration`: Número, obrigatório, entre 0 e 1440 minutos
- `notes`: String, opcional

### Login
- `email`: String, obrigatório, formato de email válido
- `password`: String, obrigatório, mínimo 6 caracteres

### Importação do Gran
- `username`: String, obrigatório
- `password`: String, obrigatório
- `startDate`: Data, obrigatório, formato YYYY-MM-DD
- `endDate`: Data, obrigatório, formato YYYY-MM-DD, deve ser maior que startDate 