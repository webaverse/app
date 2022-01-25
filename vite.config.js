import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import metaversefilePlugin from 'metaversefile/plugins/rollup.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    metaversefilePlugin(),
    reactRefresh(),
  ],

  optimizeDeps:{
    entries: ['src/**/*.js', 'src/**/*.jsx','node_modules/**/*.js', '*.js', './**/*.jsx'],
    exclude: ['ai', 'deadcode']
  },
  
  server: {
    fs: {
      strict: true,
    },
  },
})
