import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import rollupPlugin from 'metaversefile/plugins/rollup.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    rollupPlugin(),
    reactRefresh(),
  ],
  server: {
    fs: {
      strict: true,
    },
  },
})
