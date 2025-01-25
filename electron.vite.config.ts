import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    server: {
      headers: {
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob: mediastream:;",
          "media-src 'self' https: blob: mediastream: *;",
          "connect-src 'self' https: ws: wss: blob: mediastream: *;",
          "img-src 'self' https: data: blob: *;",
          "worker-src 'self' blob: *;"
        ].join(' ')
      }
    }
  }
})
