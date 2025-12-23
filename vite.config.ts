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
    sourcemap: false,
    minify: true,    
    rollupOptions: {
      output: {
        entryFileNames: 'SeamlessRouter.umd.min.js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
