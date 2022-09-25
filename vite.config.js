import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    metaversefilePlugin(),
    reactRefresh(),
  ],
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
  },
  server: {
    fs: {
      strict: true,
    },
  },
});
