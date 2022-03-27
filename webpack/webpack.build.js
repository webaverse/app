const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const ImportHttpWebpackPlugin = require('import-http/webpack');

const {
  NODE_ENV = 'production',
} = process.env;

module.exports = {
  entry: {
    server: './src/main.jsx',
  },
  mode: NODE_ENV,
  target: 'node',
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
  },
  externals: nodeExternals(),
  optimization: {
    splitChunks: {name: 'vendor', chunks: 'all'},
  },
  module: {
    rules: [
      {
        test: /\.(jsx)$/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {test: /\.(png|woff|woff2|eot|ttf|svg)$/, use: 'url-loader'},
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', 'index.js', 'index.jsx'],
  },
  plugins: [
    new ImportHttpWebpackPlugin(
      {
        realod: true,
      },
    ),
  ],
};
