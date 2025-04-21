const path = require('path');

module.exports = {
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Add any custom middleware here
      return middlewares;
    },
    // Other devServer options
    port: 3000,
    hot: true,
    open: true,
    historyApiFallback: true,
  },
  // Other webpack configuration
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
}; 