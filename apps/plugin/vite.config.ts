import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

const TRACKER_DATA_SRC = resolve(__dirname, '../../packages/tracker-lists/data')
const TRACKER_DATA_DEST = resolve(__dirname, 'dist/data')

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(__dirname, 'dist/manifest.json'),
        )
        try {
          mkdirSync(resolve(__dirname, 'dist/popup'), { recursive: true })
        } catch {}
        mkdirSync(TRACKER_DATA_DEST, { recursive: true })
        for (const file of ['easylist.json', 'disconnect.json', 'easyprivacy.json']) {
          copyFileSync(resolve(TRACKER_DATA_SRC, file), resolve(TRACKER_DATA_DEST, file))
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/form-observer.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
