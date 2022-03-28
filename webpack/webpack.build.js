const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');
const ImportHttpWebpackPlugin = require('import-http/webpack');
const {ESBuildMinifyPlugin} = require('esbuild-loader');
const {IgnorePlugin} = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const {
  NODE_ENV = 'development',
} = process.env;

module.exports = {
  mode: 'development',
  // target: 'es2020',
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 9000,
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    chunkFormat: 'module',
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

            // npm package names are URL-safe, but some servers don't like @ symbols
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
    minimize: false,
    // minimizer: [
    //   // new ESBuildMinifyPlugin({
    //   //   format: 'esm',
    //   //   target: 'es2020', // Syntax to compile to (see options below for possible values)
    //   // }),
    // ],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          // format: 'esm',
          // target: 'es2020',
        },
      },
      {
        test: /\.jsx$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'jsx',
          // format: 'esm',
          // target: 'es2020',
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
    alias: {
      node_modules: path.join(__dirname, 'node_modules'),
      bower_modules: path.join(__dirname, 'bower_modules'),
    },
    extensions: ['.js', '.jsx', 'index.js', 'index.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({template: './index.html'}),
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
