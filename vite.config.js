import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Correct : tout est dans un seul objet passé à defineConfig
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});