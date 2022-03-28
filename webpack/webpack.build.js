const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const ImportHttpWebpackPlugin = require('import-http/webpack');
const {ESBuildMinifyPlugin} = require('esbuild-loader');
const {IgnorePlugin} = require('webpack');

const {
  NODE_ENV = 'production',
} = process.env;

module.exports = {
  entry: {
    webaverse: './src/main.jsx',
  },
  mode: NODE_ENV,
  target: 'es2020',
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    chunkFormat: 'module',
    library: {
      type: 'module',
    },
  },
  optimization: {
    splitChunks: {name: 'vendor', chunks: 'all'},
    minimizer: [
      new ESBuildMinifyPlugin({
        format: 'esm',
        target: 'es2020', // Syntax to compile to (see options below for possible values)
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          format: 'esm',
          target: 'es2020',
        },
      },
      {
        test: /\.jsx$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          format: 'esm',
          target: 'es2020',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {test: /\.(png|woff|woff2|eot|ttf|svg)$/, use: 'url-loader'},
    ],
  },
  resolve: {
    fallback: {
      crypto: false,
      path: false,
      fs: false,
    },
    extensions: ['.js', '.jsx', 'index.js', 'index.jsx'],
  },
  plugins: [
    new ImportHttpWebpackPlugin(
      {
        realod: true,
      },
    ),
    new IgnorePlugin({
      checkResource(resource, context) {
        const isResourceHTTPImport = /http/.test(resource);
        const isContextHTTPImport = /http/.test(context);
        if (isContextHTTPImport || isResourceHTTPImport) {
          console.log('isResourceHTTPImport', isResourceHTTPImport, resource);
          console.log('isContextHTTPImport', isContextHTTPImport, context);
        }

        return isResourceHTTPImport;
      },
    }),
  ],
  experiments: {
    outputModule: true,
  },
};
