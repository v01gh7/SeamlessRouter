import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core')
    }
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'SeamlessRouter',
      fileName: 'SeamlessRouter',
      formats: ['es', 'umd']
    },
    sourcemap: true,
    rollupOptions: {
      output: {
        // Основные файлы в dist
        entryFileNames: '[name].[format].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name].[ext]',
        
        // UMD файл также в корень проекта
        manualChunks: undefined
      }
    }
  }
})
