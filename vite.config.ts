import { defineConfig } from 'vitest/config';
import path from 'node:path';

const ADMIN_PAGE = '/ops-k7m2x9';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        ops: path.resolve(__dirname, 'ops-k7m2x9.html'),
      },
    },
  },
  plugins: [
    {
      name: 'admin-pretty-url',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === ADMIN_PAGE || req.url === `${ADMIN_PAGE}/`) {
            req.url = '/ops-k7m2x9.html';
          }
          next();
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === ADMIN_PAGE || req.url === `${ADMIN_PAGE}/`) {
            req.url = '/ops-k7m2x9.html';
          }
          next();
        });
      },
    },
  ],
  test: {
    environment: 'jsdom',
  },
});

