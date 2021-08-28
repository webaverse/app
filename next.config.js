const path = require('path');

module.exports = {
  distDir: 'dist',
  reactStrictMode: true,
  /* async rewrites() {
    return {
      beforeFiles: [
        // These rewrites are checked after headers/redirects
        // and before all files including _next/public files which
        // allows overriding page files
        {
          source: '/wsrtc',
          destination: '/dist/wsrtc.js',
          // basePath: false,
          // has: [{ type: 'query', key: 'overrideMe' }],
        },
      ],
    };
  }, */
  webpack: (config, { isServer }) => {
    // if (isServer) {
      return {
        ...config,
        entry() {
          return config.entry().then((entry) => ({
            ...entry,
            // adding custom entry points
            wsrtc: {
              import: path.resolve(process.cwd(), 'node_modules/wsrtc/wsrtc.js'),
              // filename: path.resolve(process.cwd(), 'dist/wsrtc.js'),
              publicPath: '/static/wsrtc.js',
              filename: '/static/wsrtc.js',
              // path: '/static/wsrtc.js',
              // libraryTarget: 'module',
              library: {
                name: 'wsrtc',
                type: 'var',
              },
              /* type: 'javascript/auto',
              output: {
                scriptType: 'module',
              }, */
            },
            // run: path.resolve(process.cwd(), 'src/run.js'),
          }));
        },
        /* optimization: {
          runtimeChunk: 'single',
        }, */
        output: {
          enabledLibraryTypes: ['var', 'module'],
        },
        experiments: {
          outputModule: true,
        },
      };
    // }
  },
};