import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ShikshaSaarthi/',   // 👈 IMPORTANT — your repo name EXACTLY
  plugins: [react()],
});
