const merge = require('webpack-merge');
const main = require('./webpack.build');
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

module.exports = merge.merge(main, {
  watch: true,
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new WebpackShellPluginNext({
      onBuildEnd: {
        scripts: ['nodemon --watch dist/server.js --exec \"npm run start\"'],
        blocking: false,
        parallel: true
      },
    })
  ]
})
