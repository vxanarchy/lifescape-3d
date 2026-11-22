import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@engine': resolve(__dirname, './src/engine'),
      '@world': resolve(__dirname, './src/world'),
      '@player': resolve(__dirname, './src/player'),
      '@npcs': resolve(__dirname, './src/npcs'),
      '@vehicles': resolve(__dirname, './src/vehicles'),
      '@ui': resolve(__dirname, './src/ui'),
      '@systems': resolve(__dirname, './src/systems'),
      '@types': resolve(__dirname, './src/types'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/global.css";`,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
});