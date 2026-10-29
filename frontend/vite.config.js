import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, proxy: { '/api': 'http://localhost:4000' } },
  preview: { host: '0.0.0.0' },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/xlsx/')) return 'spreadsheet';
          if (/\/node_modules\/(recharts|d3-)/.test(id)) return 'charts';
          if (/\/node_modules\/(leaflet|react-leaflet)/.test(id)) return 'maps';
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'framework';
        }
      }
    }
  }
});
