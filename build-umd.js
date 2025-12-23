import { build } from 'vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function buildUMD() {
  console.log('🔨 Building UMD version for distribution...')
  
  try {
    // Строим основную версию
    await build(defineConfig({
      resolve: {
        alias: {
          '@core': resolve(__dirname, 'src/core')
        }
      },
      build: {
        lib: {
          entry: 'src/index.ts',
          name: 'SeamlessRouter',
          fileName: 'SeamlessRouter',
          formats: ['umd']
        },
        sourcemap: false,
        minify: true,
        outDir: '.', // В корень проекта
        emptyOutDir: false, // Не очищать выходную директорию
        rollupOptions: {
          output: {
            entryFileNames: 'SeamlessRouter.umd.min.js',
            assetFileNames: '[name].[ext]'
          }
        }
      }
    }))
    
    console.log('✅ UMD build completed: SeamlessRouter.umd.min.js')
    
    // Получаем размер файла
    const stats = fs.statSync('SeamlessRouter.umd.min.js')
    const fileSize = (stats.size / 1024).toFixed(2)
    
    console.log(`📦 File size: ${fileSize} KB`)
    
    return fileSize
    
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

// Запускаем сборку
buildUMD()