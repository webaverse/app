import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import {dependencies} from './package.json';
import fs from 'fs';

function renderChunks(deps) {
  const chunks = {};
  Object.keys(deps).forEach(key => {
    if (['three', 'metaversefile'].includes(key)) return;
    chunks[key] = [key];
  });
  return chunks;
}

const build = () => {
  return {
    name: 'build-provider', // this name will show up in warnings and errors
    // moduleParsed(data) {
    //   console.log('***********PLUGIN - 1**************', data);
    //   return null;
    // },

    generateBundle(options, bundle) {
      console.log('***********PLUGIN - 2**************', options);
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
      fs.writeFileSync('bundle.json', JSON.stringify(exports, null, 4));
      fs.writeFileSync('actualBundle.json', JSON.stringify(bundle, null, 4));

      return null;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactRefresh(),
    // metaversefilePlugin(),
  ],
  build: {
    sourcemap: false,
    polyfillDynamicImport: true,
    rollupOptions: {
      external: ['plugin-transform-react-jsx'],
      output: {
        minifyInternalExports: false,
        manualChunks: id => {
          if (id.includes('packages/three/build')) {
            return 'three';
          }else if(id.includes('web3.min.js')){
            return 'web3';
          }else if(id.includes('metaversefile.js') || id.includes('totum')){
            return 'metaversefile'
          }  else if(id.includes('metaversefile-api.js')){
            return 'metaversefile-api'
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
