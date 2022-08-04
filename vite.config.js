import {defineConfig} from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import metaversefilePlugin from 'metaversefile/plugins/rollup.js';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    metaversefilePlugin(),
    reactRefresh(),
  ],
  resolve: {
    alias: {
      '@root': path.resolve(__dirname),
      '@engine': path.resolve(__dirname, './engine'),
      '@client': path.resolve(__dirname, './src'),
      '@public': path.resolve(__dirname, './public'),
      '@thirdparty': path.resolve(__dirname, './thirdparty'),
      '@scenes': path.resolve(__dirname, './scenes'),
      '@background-fx': path.resolve(__dirname, './background-fx'),
      '@metaverse-modules': path.resolve(__dirname, './metaverse-modules'),
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
  },
  server: {
    fs: {
      strict: true,
    },
  },
});
