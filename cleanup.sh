#!/bin/bash

# Script para limpeza e manutenção do ambiente de desenvolvimento
# Criado por Claude Code

echo "🧹 Iniciando limpeza do ambiente..."

# Verificar e encerrar processos Node
echo -e "\n📊 Verificando processos Node em execução..."
NODE_PROCESSES=$(ps aux | grep node | grep -v grep | grep -v "claude" | awk '{print $2}')

if [ -n "$NODE_PROCESSES" ]; then
  echo "Encontrados processos Node: $NODE_PROCESSES"
  echo "Encerrando processos..."
  for pid in $NODE_PROCESSES; do
    echo "Encerrando processo $pid..."
    kill -9 $pid 2>/dev/null || true
  done
  echo "✅ Processos encerrados."
else
  echo "✅ Nenhum processo Node encontrado para encerrar."
fi

# Remover arquivos temporários
echo -e "\n🗑️  Removendo arquivos temporários..."
find . -name "*.log" -o -name "*.tmp" -o -name ".DS_Store" -o -name "npm-debug.log*" | xargs rm -f 2>/dev/null || true
echo "✅ Arquivos temporários removidos."

# Limpar cache Node/npm
echo -e "\n♻️  Deseja limpar o cache do npm? [y/N]"
read -r clean_npm_cache
if [[ "$clean_npm_cache" =~ ^[Yy]$ ]]; then
  echo "Limpando cache npm..."
  npm cache clean --force
  echo "✅ Cache npm limpo."
else
  echo "➖ Limpeza de cache npm ignorada."
fi

# Verificar dependências
echo -e "\n📦 Verificando dependências desatualizadas..."
npm outdated || true

echo -e "\n🧰 Deseja executar npm audit para verificar vulnerabilidades? [y/N]"
read -r run_audit
if [[ "$run_audit" =~ ^[Yy]$ ]]; then
  echo "Executando npm audit..."
  npm audit
  echo "✅ Verificação concluída."
else
  echo "➖ Verificação de vulnerabilidades ignorada."
fi

echo -e "\n📝 Sugestões de manutenção:"
echo "1. Execute 'npm update' para atualizar dependências para versões compatíveis"
echo "2. Execute 'npm audit fix' para corrigir vulnerabilidades automaticamente"
echo "3. Execute './test-all.sh' regularmente para verificar a integridade do código"

echo -e "\n✨ Limpeza concluída! Ambiente de desenvolvimento organizado."