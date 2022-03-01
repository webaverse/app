/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-expressions */
import {defineConfig} from 'vite';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import path from 'path';
import fs from 'fs';
import {transform} from 'esbuild';
import glob from 'glob';

const esbuildLoaders = ['js', 'jsx', 'ts', 'tsx'];
let plugins = [
  // reactRefresh()
];

const baseDirectory = 'assets';
const proxyModuleBase = '-proxy';

const entryPoints = [
  {
    path: 'metaversefile-api',
  },
  {
    path: './packages/totum/index.js',
    name: `${baseDirectory}/metaversefile${proxyModuleBase}.js`,
  },
  {
    path: './packages/three/build/three.module.js',
    name: `${baseDirectory}/three${proxyModuleBase}.js`,
  },
  {
    path: './packages/three-vrm/lib/three-vrm.module.min.js',
    name: `${baseDirectory}/three-vrm${proxyModuleBase}.js`,
  },
  {
    path: './packages/three/examples/jsm/**/*.js',
    name: `${baseDirectory}/{{filename}}${proxyModuleBase}.js`,
    replaceExpression: './packages',
    glob: true,
  },
];

const build = () => {
  const _entryPoints = [];

  const resolveGlob = pathToExpand => {
    return new Promise((resolve, reject) => {
      glob(pathToExpand, {}, (err, files) => {
        if (err) reject(err);
        resolve(files);
      });
    });
  };

  return {
    name: 'build-provider',
    post: true,
    renderDynamicImport({moduleId}) {
      if (moduleId.includes('metaversefile')) {
        return {
          left: 'import(`/@import/${',
          right: '}`)',
        };
      }
    },

    async buildStart() {
      for (const iterator of entryPoints) {
        if (iterator.glob) {
          const files = await resolveGlob(iterator.path);
          for (const file of files) {
            const entry = this.emitFile({
              type: 'chunk',
              id: file,
              fileName: file.replace(iterator.replaceExpression, baseDirectory),
            });
            _entryPoints.push(entry);
          }
        } else {
          const entry = this.emitFile({
            type: 'chunk',
            id: iterator.path,
            fileName: iterator.name,
          });
          _entryPoints.push(entry);
        }
      }
    },
    generateBundle(options, bundle) {
      /** testing exports */

      if (process.env.OUTPUT_EXPORTS || true) {
        const exports = {
        };

        for (const chunk of Object.keys(bundle)) {
          if (bundle[chunk].exports) {
            for (const _export of bundle[chunk].exports) {
              exports[_export] = chunk;
            }
          }
        }

        fs.writeFileSync('dist/dependencies.json', JSON.stringify(exports, null, 4));
        fs.writeFileSync('dist/actualBundle.json', JSON.stringify(bundle, null, 4));
      }
      return null;
    },
    // async transform(code, id) {
    //   const avoidTransform = false;

    //   if (code === null || id === null) {
    //     return null;
    //   }

    //   const loader = path.parse(id).ext.replace('.', '');
    //   const isNodeModule = false && id.includes('node_modules');

    //   if (!esbuildLoaders.includes(loader)) {
    //     return {
    //       code: code,
    //       map: null,
    //     };
    //   }

    //   let transformed;

    //   try {
    //     transformed = await transform(code, {
    //       loader: loader,
    //       format: loader === 'js' && !isNodeModule ? 'esm' : undefined,
    //       minifySyntax: true,
    //       minifyWhitespace: true,
    //       keepNames: true,
    //       sourcemap: true,
    //       target: ['es6'],
    //     });
    //   } catch (e) {
    //     /** Probably some developer coded jsx in js file */
    //     transformed = await transform(code, {
    //       loader: loader,
    //       minifySyntax: true,
    //       minifyWhitespace: true,
    //       keepNames: true,
    //       sourcemap: true,
    //       target: ['es6'],
    //     });
    //   }

    //   return {
    //     code: transformed.code,
    //     map: transformed.map,
    //   };
    // },
  };
};

/** Use totum if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin()]) : plugins.concat([
  build(),
]);

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  logLevel: 'info',
  esbuild: {
    format: 'esm',
  },
  build: {
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      treeshake: false,
      output: {
        exports: 'named',
        minifyInternalExports: false,
        format: 'esm',
        manualChunks: id => {
          if (id.includes('three/build')) {
            return 'three';
          } else if (id.includes('node_modules')) {
            return 'vendor';
          }
          //  else if (id.includes('three/examples')) {
          //   return 'three-examples';
          // }
          // else if (id.includes('three-vrm')) {
          //   return 'three-vrm';
          // }
          // else if (id.includes('web3.min.js')) {
          //   return 'web3';
          // }
          // else if (id.includes('totum/index.js')) {
          //   return 'metaversefile';
          // }
          // else if (id.includes('totum/constants')) {
          //   return 'totum_constants';
          // }
          //  else if (id.includes('metaversefile-api.js')) {
          //   return 'metaversefile-api';
          // }
          //  else if (id.includes('constants.js')) {
          //   return 'constants';
          // }
        },

        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  optimizeDeps: {
    entries: [
      'src/*.js',
      'src/*.jsx',
      'avatars/*.js',
      'avatars/vrarmik/*.js',
      'src/components/*.js',
      'src/components/*.jsx',
      'src/tabs/*.jsx',
      '*.js',
    ],
    exclude: ['deadcode'],
  },
  server: {
    fs: {
      strict: true,
    },
  },
});
