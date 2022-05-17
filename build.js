const fs = require('fs');
const esbuild = require('esbuild');
const cssModulesPlugin = require('esbuild-css-modules-plugin');

(async () => {
  const result = await esbuild
    .build({
      format: 'esm',
      entryPoints: ['src/main.jsx', 'webaverse.js'],
      bundle: true,
      minify: true,
      sourcemap: true,
      splitting: true,
      platform: 'browser',
      resolveExtensions: ['.js', '.jsx'],
      define: {
        this: 'window',
      },
      external: ['require', 'fs', 'path', 'module', '/public/*', '/public/bin/*'],
      target: ['chrome80', 'firefox72', 'safari13', 'edge80'],
      outdir: 'dist',
      watch: false,
      loader: {
        '.png': 'dataurl',
        '.svg': 'text',
        '.ttf': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.gltf': 'file',
        '.glb': 'file',
        '.jpg': 'file',
        '.json': 'file',
        '.mp3': 'file',
        '.mp4': 'file',
        '.ogg': 'file',
        '.wav': 'file',
        '.m4a': 'file',
        '.mov': 'file',
        '.scn': 'file',
        '.metaversefile': 'file',
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
    });

  const text = await esbuild.analyzeMetafile(result.metafile);
  console.log(text);
})();
