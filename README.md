# Study Guide

Aplicação para gerenciamento de estudos e acompanhamento de progresso.

## Visão Geral

O Study Guide é uma aplicação web que ajuda estudantes a organizar e acompanhar seus estudos. A aplicação permite:

- Registrar sessões de estudo
- Acompanhar tempo de estudo por disciplina
- Visualizar estatísticas de progresso
- Gerenciar ciclos de estudo
- Sincronizar dados entre dispositivos
- Importar dados do Gran Cursos Online

## Tecnologias

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express
- Banco de Dados: MongoDB
- Autenticação: JWT
- Armazenamento Local: IndexedDB
- Sincronização: WebSocket
- Testes: Jest, React Testing Library

## Estrutura do Projeto

```
studyguide/
├── src/
│   ├── components/     # Componentes React
│   ├── contexts/       # Contextos React
│   ├── data/          # Camada de dados
│   ├── domain/        # Regras de negócio
│   ├── hooks/         # Hooks personalizados
│   ├── services/      # Serviços
│   └── utils/         # Utilitários
├── public/            # Arquivos estáticos
├── server/            # Código do servidor
├── tests/             # Testes
└── server.js          # Servidor Express
```

## API

A aplicação utiliza uma API RESTful com os seguintes endpoints:

### Autenticação
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/register` - Registro de novo usuário
- `POST /api/auth/refresh` - Atualização de token

### Estudos
- `GET /api/studies` - Listar estudos
- `POST /api/studies` - Criar estudo
- `PUT /api/studies/:id` - Atualizar estudo
- `DELETE /api/studies/:id` - Deletar estudo
- `POST /api/studies/import` - Importar estudos
- `POST /api/studies/import/gran` - Importar estudos do Gran Cursos

### Ciclos de Estudo
- `GET /api/cycles` - Listar ciclos
- `POST /api/cycles` - Criar ciclo
- `PUT /api/cycles/:id` - Atualizar ciclo
- `DELETE /api/cycles/:id` - Deletar ciclo

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Sincronização

O sistema utiliza um mecanismo de sincronização em tempo real com as seguintes características:

- Armazenamento local com IndexedDB
- Sincronização automática com o servidor
- Resolução de conflitos
- Cache inteligente
- Offline-first

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
