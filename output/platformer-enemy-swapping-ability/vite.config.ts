import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  resolve: { alias: { '@': '/src' } },
  build: { rollupOptions: { output: { inlineDynamicImports: true } } }
});