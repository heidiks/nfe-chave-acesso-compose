import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/nfe-chave-acesso-compose/',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
