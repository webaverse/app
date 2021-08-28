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
            module: {
              rules: [
                // rules for modules (configure loaders, parser options, etc.)
                {
                  test: /.js$/,
                  exclude: /(node_modules)/,
                  use: {
                    loader: 'babel-loader',
                  },
                },
              ],
            },
            // run: path.resolve(process.cwd(), 'src/run.js'),
          }));
        },
        /* optimization: {
          runtimeChunk: 'single',
        }, */
      };
    // }
  },
};