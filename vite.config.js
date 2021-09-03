import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import metaversefilePlugin from 'metaversefile/plugins/rollup.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    metaversefilePlugin(),
    reactRefresh(),
  ],
  server: {
    fs: {
      strict: true,
    },
  },
})
