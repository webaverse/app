const fs = require('fs');
const esbuild = require('esbuild');
const cssModulesPlugin = require('esbuild-css-modules-plugin');

const wasmPlugin = require('./plugins/wasm.js');
const metaverseFile = require('./plugins/metaversefile.js');
const scn = require('./plugins/scn.js');

const transferFolders = require('./copyDir.json');
const transferFiles = require('./copyFiles.json');

const {
  copyFileSync,
  copyFolderRecursiveSync,
} = require('./file-management.js');

const start = Date.now();

if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

if (!fs.existsSync('./dist/public')) {
  fs.mkdirSync('./dist/public');
}

(async () => {
  const result = await esbuild.build({
    format: 'esm',
    entryPoints: [
      'src/main.jsx',
      // './webaverse.js'
    ],
    bundle: true,
    minify: true,
    sourcemap: true,
    splitting: false,
    platform: 'browser',
    // browser: {
    //   geometry: './public/bin/geometry.js',
    // },
    treeShaking: true,
    resolveExtensions: ['.js', '.jsx'],
    define: {
      this: 'window',
    },
    external: [
      // 'require',
      // 'fs',
      'path',
      'module',
      '/public/*',
      '/public/bin/*',
    ],
    drop: ['debugger'],
    target: ['chrome80', 'firefox72', 'safari13', 'edge80'],
    outdir: 'dist',
    watch: false,
    assetNames: 'assets/[name]-[hash]',
    loader: {
      // '.json': 'json',
      '.png': 'file',
      '.svg': 'text',
      '.ttf': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.gltf': 'json',
      '.glb': 'file',
      '.jpg': 'file',
      '.mp3': 'file',
      '.mp4': 'file',
      '.ogg': 'file',
      '.wav': 'file',
      '.m4a': 'file',
      '.mov': 'file',
      '.scn': 'json',
      '.metaversefile': 'json',
    },
    plugins: [
      cssModulesPlugin({
        inject: false,
        localsConvention: 'camelCaseOnly',
        generateScopedName: (name, filename, css) => string,
        cssModulesOption: {},
        v2: true,
      }),
      // metaverseFile,
      // wasmPlugin,
      scn,
    ],
  });

  const report = await esbuild.analyzeMetafile(result.metafile);

  fs.readFile('./index.html', function(err, html) {
    if (err) {
      throw err;
    }
    var result = html.toString();
    result = result.replace('<% APP_JS %>', '/main.js');
    result = result.replace('<% APP_CSS %>', '/main.css');

    fs.writeFile(
      './dist/index.html',
      result,
      {
        encoding: 'utf8',
      },
      function(err) {},
    );
  });

  fs.writeFile(
    './build-system/report.txt',
    report,
    {
      encoding: 'utf8',
    },
    function(err) {},
  );

  transferFiles.forEach(file => {
    copyFileSync(file, `./dist/${file.replace('./', '')}`);
  });

  transferFolders.forEach(folder => {
    copyFolderRecursiveSync(folder, './dist');
  });
  
  console.log((Date.now() - start) / 1000);
})();
