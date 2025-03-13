#!/bin/bash

# Script para configurar Node.js 18 como padrão no sistema
# Criado por Claude Code

echo "Configurando Node.js 18 como versão padrão..."

# Backup do .npmrc se existir
if [ -f ~/.npmrc ]; then
  echo "Fazendo backup do .npmrc existente para .npmrc.backup"
  mv ~/.npmrc ~/.npmrc.backup
fi

# Adicionar NVM ao .bashrc e .zshrc se não estiver lá
for rcfile in ~/.bashrc ~/.zshrc; do
  if [ -f "$rcfile" ]; then
    if ! grep -q "nvm.sh" "$rcfile"; then
      echo "Configurando NVM no $rcfile"
      echo '' >> "$rcfile"
      echo '# NVM configuration' >> "$rcfile"
      echo 'export NVM_DIR="$HOME/.nvm"' >> "$rcfile"
      echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm' >> "$rcfile"
      echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> "$rcfile"
    fi
  fi
done

# Configurar Node.js 18 como padrão
source ~/.nvm/nvm.sh
nvm alias default v18.20.7

# Criar arquivo .nvmrc na pasta home para definir Node.js 18 como padrão global
echo "v18.20.7" > ~/.nvmrc

echo "Verificando configuração..."
nvm current

echo ""
echo "✅ Configuração concluída! Node.js 18 agora é a versão padrão."
echo ""
echo "Para aplicar as alterações na sessão atual, execute:"
echo "source ~/.bashrc  # ou source ~/.zshrc se estiver usando zsh"
echo ""
echo "Novas sessões de terminal já carregarão automaticamente o Node.js 18."
echo "Para verificar a versão atual do Node, execute: node -v"
echo ""
echo "Para executar o teste de integração, utilize: npm run test:integration"