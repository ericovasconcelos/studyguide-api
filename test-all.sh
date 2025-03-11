#!/bin/bash

# Script simples para executar todos os testes com Node 18
echo "🧪 Executando todos os testes com Node 18..."

# Usar o Node 18 via nvm
source ~/.nvm/nvm.sh
nvm use 18

# Verificar se a mudança teve sucesso
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION != v18* ]]; then
  echo "❌ Não foi possível mudar para Node.js 18. Por favor, configure manualmente."
  exit 1
else
  echo "✅ Usando Node.js $NODE_VERSION"
fi

# Função para imprimir mensagens de erro
print_error() {
  echo -e "\n❌ $1"
}

# Executar testes de componentes React
echo -e "\n🧩 Executando testes de componentes..."
npm test -- --watchAll=false
if [ $? -ne 0 ]; then
  print_error "Testes de componentes falharam!"
else
  echo "✅ Testes de componentes passaram!"
fi

# Executar testes de integração
echo -e "\n🔄 Executando testes de integração..."
if [ -f /home/ericovasconcelos/projects/studyguide/tests/cycle-integration.test.js ]; then
  npm run test:integration
  if [ $? -ne 0 ]; then
    print_error "Testes de integração falharam!"
  else
    echo "✅ Testes de integração passaram!"
  fi
else
  print_error "Arquivo de teste de integração não encontrado."
fi

# Executar testes de API (iniciando o servidor primeiro)
echo -e "\n🌐 Executando testes de API..."
echo "Iniciando o servidor no background..."
# Inicia o servidor em background e salva o PID
node server.js > /dev/null 2>&1 & 
SERVER_PID=$!

# Espera 5 segundos para o servidor iniciar
echo "Aguardando servidor inicializar..."
sleep 5

# Executa os testes
npm run test:api
API_TEST_RESULT=$?

# Mata o servidor
echo "Encerrando o servidor (PID: $SERVER_PID)..."
kill -9 $SERVER_PID

# Verifica o resultado
if [ $API_TEST_RESULT -ne 0 ]; then
  print_error "Testes de API falharam!"
else
  echo "✅ Testes de API passaram!"
fi

echo -e "\n✅ Todos os testes foram executados!"