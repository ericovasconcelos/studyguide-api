const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add our custom webpack configuration
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        return middlewares;
      },
    };
  }

  return config;
}; 