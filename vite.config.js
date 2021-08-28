import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import webaversePlugin from './rollup-webaverse-plugin.js'

/* const pathAliasMap = {
  'webaverse': '/app-object.js',
}; */

// https://vitejs.dev/config/
export default defineConfig({
  /* resolvers: [
    {
      alias(path) {
        for (const [slug, res] of Object.entries(pathAliasMap)) {
          if (path.startsWith(slug)) {
            return path.replace(slug, res)
          }
        }
      },
    },
  ], */
  plugins: [
    webaversePlugin(),
    reactRefresh(),
  ],
})
