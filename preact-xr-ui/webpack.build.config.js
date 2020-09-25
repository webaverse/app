const path = require('path');
const webpack = require('webpack');
const entry = {
    inventory: './src/components/Inventory.tsx',
};

module.exports = {
    entry,
    mode: 'production',
    devtool: 'cheap-module-source-map',
    output: {
        path: path.join(__dirname, 'build'),
        filename: '[name]/[name].bundle.js'
    },
    resolve: {
        alias: {
            react: 'preact/compat',
            'react-dom': 'preact/compat'
        }
    },
    optimization: {
        minimize: true
    },
    module: {
        rules: [
            {
                enforce: "pre",
                test: /\.js$/,
                use: [
                    {
                        loader: "source-map-loader"
                    }
                ] 
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                loader: "ts-loader"
            },
            {
                test: /\.(less|css)$/,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader', 'less-loader']
            }
        ]
    },
};