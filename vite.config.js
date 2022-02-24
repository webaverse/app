/* eslint-disable no-unused-expressions */
import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import path from 'path';
import fs from 'fs';
import defaultExport from 'rollup-plugin-export-default';
import esbuild from 'rollup-plugin-esbuild-transform';
import {Loader, TransformOptions, Message, transform, formatMessages} from 'esbuild';

let plugins = [reactRefresh()];

/** Manually configure default exporters so they can be added into proxy modules */
const defaultExporters = {
  'three.js': 'THREE',
  'metaversefile.js': 'metaversefile',
};

const avoidTransforms = ['/packages/totum/index.js'];

const build = () => {
  return {
    name: 'build-provider',
    load(id) {
      const importee = id;

      if (this.getModuleInfo(importee).hasDefaultExport) {
        console.log('*****************', importee);
        let code = `export * from ${JSON.stringify(
          importee,
        )};`;
        code += `export { default } from ${JSON.stringify(importee)};`;
        return code;
      }

      return null;
    },
    generateBundle(options, bundle) {
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
        const parsedChunk = path.parse(chunk);
        if (defaultExporters[parsedChunk.base]) {
          fs.writeFileSync(`dist/assets/${parsedChunk.name}-proxy${parsedChunk.ext}`,
        `
          export * from './${parsedChunk.base}'
          export {${defaultExporters[parsedChunk.base]} as default} from './${parsedChunk.base}'
        `);
        }
      }

      if (process.env.OUTPUT_EXPORTS || true) {
        fs.writeFileSync('dist/dependencies.json', JSON.stringify(exports, null, 4));
        fs.writeFileSync('dist/actualBundle.json', JSON.stringify(bundle, null, 4));
      }
      return null;
    },
    // async transform(code, id) {
    //   let avoidTransform = false;

    //   if (code === null || id === null) {
    //     return null;
    //   } else if (avoidTransforms.some(v => id.includes(v))) {
    //     console.log('\n*****************************', id);
    //     console.log('\n');
    //     avoidTransform = true;
    //   }

    //   const transformed = await transform(code, {
    //     sourcefile: id,
    //     // minify: true,
    //     loader: 'js',
    //     minifySyntax: true,
    //     minifyWhitespace: true,
    //     keepNames: true,
    //     sourcemap: true,
    //     target: ['es6'],
    //   });

    //   if (avoidTransform) {
    //     console.log(code);
    //   }

    //   return {
    //     code: avoidTransform ? code : transformed.code,
    //     map: transformed.map,
    //   };
    // },
  };
};

/** Use totum if not production */
plugins = process.env.NODE_ENV !== 'production' ? plugins.concat([metaversefilePlugin()]) : plugins.concat([defaultExport(), build()]);

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  build: {
    sourcemap: false,
    rollupOptions: {
      external: ['plugin-transform-react-jsx'],
      preserveEntrySignatures: true,
      output: {
        exports: 'none',
        compact: false,
        format: 'module',
        // preserveModules: true,
        minifyInternalExports: false,
        manualChunks: id => {
          if (id.includes('three/examples') || id.includes('three/build')) {
            return 'three';
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
      plugins: [
        build()],
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
