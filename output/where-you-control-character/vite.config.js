import { defineConfig } from 'vite';
export default defineConfig({
    root: '.',
    publicDir: false,
    build: {
        outDir: 'dist',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        rollupOptions: {
            input: 'index.html'
        }
    },
    server: {
        port: 3000,
        open: true
    }
});