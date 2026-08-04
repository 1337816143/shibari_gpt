import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/shibari_gpt/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
    manifest: true,
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/')) return 'react';
          if (id.includes('/node_modules/three-stdlib/')) return 'three-stdlib';
          if (id.includes('/node_modules/@react-three/')) return 'react-three';
          if (id.includes('/node_modules/three/')) return 'three-core';
          return undefined;
        },
      },
    },
  },
});
