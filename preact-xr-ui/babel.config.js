module.exports = (api) => {
    api.cache(false);
    const presets = [
        '@babel/preset-env',
        'babel-preset-preact',
    ];
    const plugins = [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-optional-chaining'
    ];
    return {
        presets,
        plugins
    };
};