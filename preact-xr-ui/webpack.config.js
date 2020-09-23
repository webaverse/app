const path = require('path');
const webpack = require('webpack');

const entry = {
    inventory: './components/Inventory.js',
    toolbar: './components/Toolbar.js'
};

module.exports = {
    entry,
    mode: 'development',
    devtool: 'eval-source-map',

    output: {
        path: path.join(__dirname, 'build'),
        publicPath: '/',
        filename: '[name]/bundle.[name].js'
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
              }
        ]
    },
};