const esbuild = require('esbuild');
const cssModulesPlugin = require('esbuild-css-modules-plugin');

esbuild
  .build({
    format: 'esm',
    entryPoints: ['src/main.jsx'],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'browser',
    resolveExtensions: ['.js', '.jsx'],
    define: {
      this: 'window',
    },
    target: ['chrome80', 'firefox72', 'safari13', 'edge80'],
    outfile: 'dist/out.js',
    watch: true,
    loader: {
      '.png': 'dataurl',
      '.svg': 'text',
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.gltf': 'file',
      '.glb': 'file',
    },
    plugins: [
      cssModulesPlugin({
        inject: false,
        localsConvention: 'camelCaseOnly',
        generateScopedName: (name, filename, css) => string,
        cssModulesOption: {},
        v2: true,
      }),
    ],
  })
  .then(result => {
    // console.log('watching...');
  });
