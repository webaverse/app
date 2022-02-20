/* eslint-disable no-unused-expressions */
import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import {dependencies} from './package.json';
import fs from 'fs';
import defaultExport from 'rollup-plugin-export-default';

let plugins = [reactRefresh()];
/** Use totum if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin(), defaultExport()]) : [];

const build = () => {
  return {
    name: 'build-provider',
    generateBundle(options, bundle) {
      const exports = {
        // "_____NAME______", "filePath"
      };

      for (const chunk of Object.keys(bundle)) {
        if (bundle[chunk].exports) {
          for (const _export of bundle[chunk].exports) {
            exports[_export] = chunk;
          }
        }
      }
      fs.writeFileSync('dist/dependencies.json', JSON.stringify(exports, null, 4));
      return null;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  build: {
    sourcemap: false,
    rollupOptions: {
      external: ['plugin-transform-react-jsx'],
      output: {
        minifyInternalExports: false,
        manualChunks: id => {
          if (id.includes('three/examples') || id.includes('three/build')) {
            return 'three';
          } else if (id.includes('three-vrm')) {
            return 'three-vrm';
          } else if (id.includes('web3.min.js')) {
            return 'web3';
          } else if (id.includes('metaversefile.js') || id.includes('totum')) {
            return 'metaversefile';
          } else if (id.includes('metaversefile-api.js')) {
            return 'metaversefile-api';
          }
        },
        assetFileNames: 'assets/[name].[ext]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
      plugins: [build()],
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
