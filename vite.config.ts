import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Use the default HMR settings so it infers from window.location
      // Keep file watching disabled if requested by the platform to save CPU
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
