#!/bin/bash

# Script para executar os testes do Study Guide
# Criado por Claude Code

echo "🧪 Iniciando execução de testes..."

# Verificando se o Node 18 está configurado
NODE_VERSION=$(node -v)
if [[ $NODE_VERSION != v18* ]]; then
  echo "⚠️ AVISO: Você não está usando Node.js 18 (atual: $NODE_VERSION)"
  
  # Tentar usar o nvm se disponível
  if command -v nvm &> /dev/null; then
    echo "🔄 Tentando mudar para Node.js 18 com nvm..."
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
  else
    echo "❌ nvm não encontrado. Por favor, instale o Node.js 18 manualmente."
    echo "💡 Dica: use o script setup_node18.sh na raiz do projeto"
    exit 1
  fi
fi

# Função para executar os testes básicos de componentes
run_component_tests() {
  echo -e "\n🧩 Executando testes de componentes..."
  npm test -- --watchAll=false
}

# Função para executar teste de integração
run_integration_tests() {
  echo -e "\n🔄 Executando testes de integração..."
  cd tests
  npm run test:integration
  cd ..
}

# Função para executar testes de API
run_api_tests() {
  echo -e "\n🌐 Executando testes de API..."
  npm run test:api
}

# Menu de opções
echo -e "\n📋 Selecione o tipo de teste a executar:"
echo "1) Testes de componentes React"
echo "2) Testes de integração"
echo "3) Testes de API"
echo "4) Executar todos os testes"
echo "5) Sair"

read -p "Digite sua escolha (1-5): " choice

case $choice in
  1)
    run_component_tests
    ;;
  2)
    run_integration_tests
    ;;
  3)
    run_api_tests
    ;;
  4)
    run_component_tests
    run_integration_tests
    run_api_tests
    ;;
  5)
    echo "👋 Saindo..."
    exit 0
    ;;
  *)
    echo "❌ Opção inválida!"
    exit 1
    ;;
esac

echo -e "\n✅ Execução de testes concluída!"