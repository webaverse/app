const path = require('path');
const webpack = require('webpack');
const entry = {
    inventory: './src/components/Inventory.tsx',
};

module.exports = {
    entry,
    mode: 'development',
    devtool: 'eval-source-map',
    watch: true,
    output: {
        path: path.join(__dirname, 'dev'),
        filename: '[name]/[name].bundle.js'
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
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader"
                    }
                ]
            },
            {
                test: /\.(less|css)$/,
                exclude: /node_modules/,
                use: ['style-loader', 'css-loader', 'less-loader']
            },
        ]
    },
};