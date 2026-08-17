import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'local-app',
  plugins: [react()],
  build: { outDir: '../dist-local', emptyOutDir: true }
});
