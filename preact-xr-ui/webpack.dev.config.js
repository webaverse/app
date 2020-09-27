const path = require('path');
const webpack = require('webpack');
const EsmWebpackPlugin = require("@purtuga/esm-webpack-plugin");
const entry = {
    index: './src/index.js',
    inventory: './src/components/Inventory.js',
};

module.exports = {
    entry,
    mode: 'development',
    devtool: 'eval-source-map',
    watch: false,
    output: {
        path: path.join(__dirname, 'dev'),
        filename: '[name]/[name].bundle.js',
        library: 'preactXRUI'
    },
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat'
        }
    },
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                loader: "source-map-loader"
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.(less|css)$/,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader', 'less-loader']
            },
        ]
    },
    plugins: [
        new EsmWebpackPlugin()
    ]
};