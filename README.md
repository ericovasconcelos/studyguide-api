# Study Guide

Aplicação para gerenciamento de estudos e acompanhamento de progresso.

## Visão Geral

O Study Guide é uma aplicação web que ajuda estudantes a organizar e acompanhar seus estudos. A aplicação permite:

- Registrar sessões de estudo
- Acompanhar tempo de estudo por disciplina
- Visualizar estatísticas de progresso (Dashboard)
- Gerenciar ciclos de estudo (localmente e via API Gran Cursos)
- Sincronizar dados entre dispositivos (placeholder)
- Importar dados do Gran Cursos Online

## Tecnologias

- **Frontend:** React, TypeScript, Ant Design (Antd), Tailwind CSS (via Antd/utility classes)
- **Backend:** Node.js, Express
- **Banco de Dados:** MongoDB (usado pelo backend, não diretamente pelo frontend)
- **Gerenciamento de Estado (Frontend):** React Context API (DataContext), Custom Hooks (useStudies)
- **Armazenamento Local (Frontend):** IndexedDB (via LocalStorageAdapter)
- **Testes:** (Configuração base para Jest/React Testing Library presente, mas sem testes implementados)

## Estrutura do Projeto

```
studyguide/
├── build/             # Arquivos de build de produção (gerados por npm run build)
├── node_modules/      # Dependências do projeto
├── public/            # Arquivos estáticos (index.html, favicon, etc.)
├── server/            # Código do backend (Node.js/Express)
├── src/               # Código fonte do frontend (React)
│   ├── components/    # Componentes React reutilizáveis
│   ├── config/        # Configurações do frontend (auth, env)
│   ├── contexts/      # React Context (DataContext)
│   ├── data/          # Lógica de dados frontend (adapters, config, models, repositories)
│   ├── domain/        # Lógica de domínio (entidades, value objects, interfaces, use cases)
│   ├── hooks/         # Hooks React customizados (useStudies, useData)
│   ├── services/      # Serviços específicos (Import, DataCleanup)
│   ├── utils/         # Utilitários gerais (logger, adapters, etc.)
│   ├── App.css        # Estilos globais
│   ├── App.tsx        # Componente principal da aplicação
│   ├── index.css      # Estilos base (geralmente do Tailwind/Antd)
│   ├── index.js       # Ponto de entrada do React
│   └── ...
├── .env               # Variáveis de ambiente locais (NÃO versionar)
├── .env.example       # Exemplo de variáveis de ambiente
├── .gitignore         # Arquivos/pastas ignorados pelo Git
├── package.json       # Metadados e dependências do projeto
├── README.md          # Este arquivo
├── server.js          # Ponto de entrada do servidor backend
├── tsconfig.json      # Configuração do TypeScript
└── ...                # Outros arquivos de configuração (webpack, etc.)
```

## API (Backend)

O servidor backend (`server.js`) expõe uma API RESTful. Alguns endpoints notáveis:

- `/api/health`, `/api/explore`, `/api/diagnostic`: Verificação de status e conexão.
- `/api/studies/*`: Endpoints para CRUD de estudos (usados pelo `ServerSyncAdapter`).
- `/sync`: Endpoint para sincronização (usado pelo `ServerSyncAdapter`).
- `/mock-gran-api`: Endpoint para simular a API do Gran (desenvolvimento).
- `/status`: Endpoint de status do servidor backend.

*Nota:* O frontend interage primariamente com sua própria camada de dados (`DataContext`, `useStudies`, adapters), que por sua vez pode interagir com esta API backend ou diretamente com o armazenamento local.

## Configuração do Ambiente de Desenvolvimento

1.  **Pré-requisitos:**
    *   Node.js (Versão 18.x - Use `nvm use 18` se tiver NVM)
    *   npm (geralmente vem com o Node.js)
    *   Git
2.  **Clonar o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd studyguide
    ```
3.  **Instalar as dependências:**
    ```bash
    npm install
    ```
4.  **Configurar as variáveis de ambiente:**
    *   Copie o arquivo de exemplo: `cp .env.example .env`
    *   Edite o arquivo `.env` e preencha as variáveis necessárias (ex: `MONGODB_URI` para o backend, `REACT_APP_API_URL` se o backend não rodar em `http://localhost:3001`).
5.  **Executar o ambiente de desenvolvimento:**
    *   Este comando inicia o servidor de frontend (React) e o servidor de backend (Node.js) simultaneamente com hot-reload.
    ```bash
    npm run dev
    ```
6.  Acesse a aplicação em `http://localhost:3000` (ou a porta definida pelo React).

## Outros Comandos Úteis

*   `npm run build`: Cria a build de produção otimizada na pasta `build/`.
*   `npm start`: Inicia apenas o servidor de desenvolvimento do frontend.
*   `npm run server`: Inicia apenas o servidor de backend.
*   `npm test`: Executa os testes (se houver).
*   `npx tsc`: Verifica erros de TypeScript em todo o projeto.

## Sincronização (Frontend)

O frontend utiliza um padrão com `DataContext` e `StorageAdapter` para gerenciar dados.

- **`DataContext`:** Provê funções centralizadas para acesso e modificação de dados (`getStudies`, `saveStudy`, etc.).
- **`useStudies` Hook:** Abstrai o acesso ao contexto e gerencia o estado local (dados, loading, erro) para os componentes.
- **`StorageAdapter` Interface:** Define um contrato para diferentes mecanismos de armazenamento (local, servidor).
- **`LocalStorageAdapter`:** Implementação que usa IndexedDB para persistência local.
- **`ServerSyncAdapter`:** Implementação que interage com a API backend.
- **`CompositeAdapter`:** Combina os adapters local e do servidor para tentar operações no servidor com fallback local.
- A sincronização ativa entre local e servidor ainda precisa ser totalmente implementada (função `sync` é placeholder).

## Contribuição

1.  Fork o projeto
2.  Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3.  Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4.  Push para a branch (`git push origin feature/AmazingFeature`)
5.  Abra um Pull Request

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
