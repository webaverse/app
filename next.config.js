const path = require('path');

module.exports = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // if (isServer) {
      return {
        ...config,
        entry() {
          return config.entry().then((entry) => ({
            ...entry,
            // adding custom entry points
            wsrtc: path.resolve(process.cwd(), 'node_modules/wsrtc/wsrtc.js'),
            // run: path.resolve(process.cwd(), 'src/run.js'),
          }));
        },
        /* output: {
          filename: '[name].js',
          path: __dirname + '/dist',
        }, */
      };
    // }
  },
};