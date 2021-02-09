const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: "./app.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: [
          /node_modules/
        ],
      },
      {
        test: /\.css?$/,
        use: ["style-loader", "css-loader"],
      },
    ]
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./index.html"
    }),
    new CopyPlugin({
      patterns: [
        { from: "./assets", to: "./assets" },
        { from: "./bin", to: "./bin" },
        { from: "./animations", to: "./animations" },
        { from: "./land-textures", to: "./land-textures" },
        { from: "./index.css", to: "./index.css" },
        { from: "./favicon.ico", to: "./favicon.ico" },
        { from: "./GeosansLight.ttf", to: "./GeosansLight.ttf" }
      ],
    }),
  ],
};