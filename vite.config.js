import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import webaversePlugin from './rollup-webaverse-plugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    webaversePlugin(),
    reactRefresh(),
  ],
  server: {
    fs: {
      strict: true,
    },
  },
})
