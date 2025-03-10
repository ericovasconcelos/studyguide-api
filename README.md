# StudyGuide - Dashboard de Estudos

Uma aplicação para tracking de estudos que se integra com a plataforma Gran Cursos.

## Recursos

- 📊 Dashboard completo de análise de estudos
- 📈 Gráficos interativos e estatísticas detalhadas
- 🔄 Sincronização com Gran Cursos para importar dados de estudo
- 📱 Suporte para sincronização entre dispositivos
- 🔍 Filtros avançados por matéria, período e datas
- 📅 Gerenciamento de ciclos de estudo

## Estrutura do Projeto

```
studyguide/
├── public/              # Arquivos estáticos
├── src/                 # Código fonte do frontend (React)
│   ├── components/      # Componentes React
│   └── utils/           # Funções utilitárias
├── tests/               # Testes automatizados
├── mockDataGenerator.js # Gerador de dados simulados
└── server.js            # Servidor API (proxy para Gran Cursos)
```

## Pré-requisitos

- Node.js v18 ou superior
- NPM v9 ou superior

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/studyguide.git
cd studyguide
npm install
```

## Execução

### Ambiente de Desenvolvimento

Para iniciar o ambiente de desenvolvimento completo:

```bash
npm run dev
```

Isso iniciará:
- Frontend React na porta 3000
- API local na porta 5000

### Apenas o Frontend

```bash
npm start
```

### Apenas a API

```bash
npm run server
```

## Testes

### Testes do Frontend

```bash
npm test
```

### Testes da API

```bash
npm run test:api
```

## API Local

A API local atua como um proxy para a API do Gran Cursos, facilitando o desenvolvimento e os testes.

### Endpoints

- `GET /status` - Verifica o status do servidor
- `POST /verify-token` - Verifica se um token JWT é válido
- `POST /fetch-gran-data` - Busca dados de estudo do Gran Cursos
- `GET /mock-gran-api` - Simula a API do Gran Cursos (para testes)

### Tokens de Teste

Para desenvolvimento, você pode usar estes tokens:
- `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo`
- `test-token-1234`

## Integração com Gran Cursos

A aplicação se conecta à API do Gran Cursos para importar dados de estudo. Para usar esta funcionalidade, você precisa de um token JWT válido do Gran Cursos.

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -am 'Adiciona nova funcionalidade'`)
4. Envie para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um Pull Request
