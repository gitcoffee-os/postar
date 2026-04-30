import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src'),
      '~/*': resolve(__dirname, 'src/*'),
      'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js'
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        unused: false,
        dead_code: false
      },
      keep_classnames: true,
      keep_fnames: true
    },
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/entrypoints/sidepanel/index.html'),
        background: resolve(__dirname, 'src/entrypoints/background.ts'),
        content: resolve(__dirname, 'src/entrypoints/content.ts')
      },
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'assets/[name]-[hash].cjs'
          }
          return 'assets/[name]-[hash].js'
        },
        format: 'es'
      }
    },
    assetsDir: 'assets'
  },
  base: './'
})
