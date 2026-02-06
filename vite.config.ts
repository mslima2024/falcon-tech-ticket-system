import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/falcon-tech-ticket-system/',
  plugins: [react()],
  server: {
    port: 3001,
  },
});
