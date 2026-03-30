import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/nfe-chave-acesso-compose/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
