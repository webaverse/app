/* eslint-disable no-constant-condition */
/* eslint-disable no-unused-expressions */
import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import path from 'path';
import fs from 'fs';
import defaultExport from 'rollup-plugin-export-default';
// import esbuild from 'rollup-plugin-esbuild-transform';
import {transform} from 'esbuild';
import esbuild from 'rollup-plugin-esbuild';

const esbuildLoaders = ['js', 'jsx', 'ts', 'tsx', 'text', 'base64', 'file', 'dataurl', 'binary', 'default'];
let plugins = [
  // reactRefresh()
];

/** Manually configure default exporters so they can be added into proxy modules */
const defaultExporters = {
  'three.js': 'THREE',
  'metaversefile.js': 'metaversefile',
};

const avoidTransforms = ['/packages/totum/index.js', 'three/build'];

const build = () => {
  let metaversefile, threejs;

  return {
    name: 'build-provider',
    post: true,
    buildStart() {
      metaversefile = this.emitFile({
        type: 'chunk',
        id: './packages/totum/index.js',
        fileName: 'assets/metaversefile.js',
      });
      threejs = this.emitFile({
        type: 'chunk',
        id: './packages/three/build/three.module.js',
        fileName: 'assets/three-proxy.js'
      });
    },
    generateBundle(options, bundle) {
      if (process.env.OUTPUT_EXPORTS || true) {
        const exports = {
          // "_____NAME______", "filePath"
        };
  
        /** testing exports */
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
    async transform(code, id) {
      const avoidTransform = false;

      if (code === null || id === null) {
        return null;
      } else if (avoidTransforms.some(v => id.includes(v))) {
        return {
          code: code,
          map: null,
        };
      }

      const loader = path.parse(id).ext.replace('.', '');

      if (!esbuildLoaders.includes(loader)) {
        return {
          code: code,
          map: null,
        };
      }

      const transformed = await transform(code, {
        loader: loader,
        minifySyntax: true,
        minifyWhitespace: true,
        keepNames: true,
        sourcemap: true,
        target: ['es6'],
      });

      if (id.includes('three/build')) {
        console.log('*************** coming here*******************');
        console.log(id);
        console.log('*************** coming here*******************');
        fs.writeFileSync('three.js', JSON.stringify(transformed.code, null, 5));
      }

      return {
        code: transformed.code,
        map: transformed.map,
      };
    },
  };
};

/** Use totum if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin()]) : plugins.concat([
  build()
]);

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  logLevel: 'info',
  build: {
    rollupOptions: {
      preserveEntrySignatures: 'strict',
      treeshake: false,
      output: {
        exports: 'named',
        minifyInternalExports: false,
        manualChunks: id => {
          if (id.includes('three/build')) {
            return 'three';
          } else if (id.includes('three/examples')) {
            return 'three-examples';
          } else if (id.includes('three-vrm')) {
            return 'three-vrm';
          } else if (id.includes('web3.min.js')) {
            return 'web3';
          } else if (id.includes('totum/index.js')) {
            return 'metaversefile';
          } else if (id.includes('totum/constants')) {
            return 'totum_constants';
          } else if (id.includes('metaversefile-api.js')) {
            return 'metaversefile-api';
          } else if (id.includes('constants.js')) {
            return 'constants';
          }
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
