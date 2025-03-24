import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // accessible depuis toutes les IP
    port: 5173,      // port par défaut de Vite
  },
});