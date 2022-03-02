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

let entryPoints = [
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
  {
    path: './avatars/**/*.js',
    exclude: ['avatars.js'],
    replaceExpression: '.',
    glob: true,
  },
  {
    path: './packages/wsrtc/*.js',
    replaceExpression: './packages',
    glob: true,
  },
];

//entryPoints = [];

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
        iterator.exclude = iterator.exclude || [];
        if (iterator.glob) {
          const files = await resolveGlob(iterator.path);
          for (const file of files) {
            let name = path.parse(file).base;
            if(iterator.exclude.length > 0){
              console.log(name, iterator.exclude);
            }
            if(!iterator.exclude.includes(name)){
              const entry = this.emitFile({
                type: 'chunk',
                id: file,
                fileName: file.replace(iterator.replaceExpression, baseDirectory),
              });
              _entryPoints.push(entry);  
            }else{
              console.log('******* EXCLUDING ***********', name);
            }
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

    //   const isNodeModule = id.includes('node_modules');

    //   if (!esbuildLoaders.includes(loader)) {
    //     return {
    //       code: code,
    //       map: null,
    //     };
    //   }

    //   const transformed = await transform(code, {
    //     loader: loader,
    //     format: loader === 'js' && !isNodeModule ? 'esm' : undefined,
    //     minifySyntax: false,
    //     minifyWhitespace: true,
    //     keepNames: true,
    //     sourcemap: true,
    //     target: ['es6'],
    //   });

    //   return {
    //     code: transformed.code,
    //     map: transformed.map,
    //   };
    // },
    resolveImportMeta(property, {moduleId}) {
      // if (property === 'url') {
      //   return '"./"';
      // }
      return null;
    },
  };
};

/** Use totum if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin()]) : plugins.concat([
  build(),
]);

const viteConfiProduction = {
  build: {
    polyfillModulePreload: false,
    format: 'es',
    target: 'esnext',
    manifest: true,
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      output: {
        // __vite_skip_esbuild__: true,
        exports: 'named',
        minifyInternalExports: false,
        format: 'es',
        manualChunks: id => {
          if (id.includes('three/build')) {
            return 'three';
          }
          else if (id.includes('ceramic')) {
            return 'ceramic';
          }  
          // else if (id.includes('node_modules')) {
          //   return 'vendor';
          // }

          else if (id.includes('three-vrm')) {
            return 'three-vrm';
          } else if (id.includes('web3.min.js')) {
            return 'web3';
          }else if (id.includes('totum/index.js')) {
            return 'metaversefile';
          }
          // else if (id.includes('totum/constants')) {
          //   return 'totum_constants';
          // }
          // else if (id.includes('metaversefile-api.js')) {
          //   return 'metaversefile-api';
          // } 
          // else if (id.includes('metaverse-modules.js')) {
          //   return 'metaverse-modules';
          // }
          else if (id.includes('app/util.js')) {
            return 'util';
          }

          //  else if (id.includes('wsrtc')) {
          //   return 'wsrtc';
          // }
          // else if (id.includes('src/')) {
          //   return 'ui';
          // } 

          //return 'app';
        },
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
};

const defaultConfig = {
  plugins,
  logLevel: 'info',
  server: {
    fs: {
      strict: true,
    },
  },
};

const config = {
  ...defaultConfig,
  ...process.env.NODE_ENV === 'production' ? viteConfiProduction : {},
};

console.log('Using Node Env', process.env.NODE_ENV);
console.log('Using Config', config);

// https://vitejs.dev/config/
export default defineConfig(config);
