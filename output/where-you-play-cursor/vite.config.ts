import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
  root: '.',
  plugins: [],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    }
  },
  server: {
    open: true,
  }
});