import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import totumPlugin from 'totum/plugins/rollup.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    totumPlugin(),
    reactRefresh(),
  ],
  server: {
    fs: {
      strict: true,
    },
  },
})
