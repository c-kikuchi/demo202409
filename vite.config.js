import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  base:"/demo202409/",
  build: {
    //outDir:"docs",
    //minify:false
  },
  //optimizeDeps:{
  //  disabled :true
  //}
})
