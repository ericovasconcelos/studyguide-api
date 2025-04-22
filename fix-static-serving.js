// fix-static-serving.js
const fixStaticServing = (req, res, next) => {
  // Lista de caminhos da API que sabemos que funcionam
  const apiPaths = ['/api', '/status', '/sync'];
  
  // Se for uma rota de API ou uma das rotas conhecidas, prossiga normalmente
  if (req.path.startsWith('/api/') || apiPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Para a rota raiz, retorne um status JSON
  if (req.path === '/') {
    return res.json({
      status: 'ok',
      message: 'StudyGuide API is running',
      environment: process.env.NODE_ENV || 'development'
    });
  }
  
  // Para qualquer outra rota não encontrada, retorne 404 em JSON
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
};

module.exports = fixStaticServing; 