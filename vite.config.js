import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import {dependencies} from './package.json';

function renderChunks(deps) {
  const chunks = {};
  Object.keys(deps).forEach(key => {
    if (['three', 'metaversefile'].includes(key)) return;
    chunks[key] = [key];
  });
  return chunks;
}

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
