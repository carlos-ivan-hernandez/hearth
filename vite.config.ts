import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import {defineConfig} from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 1780,
  },
  plugins: [react(), tailwindcss()],
});
