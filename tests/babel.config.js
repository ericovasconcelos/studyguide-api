module.exports = {
  presets: [
    ['@babel/preset-env', { 
      targets: { node: 'current' },
      modules: 'auto' // Permite que o Babel decida se converte para CommonJS ou mantém como ES modules
    }],
    '@babel/preset-react'
  ],
};