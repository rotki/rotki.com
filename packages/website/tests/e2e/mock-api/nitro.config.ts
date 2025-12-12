import process from 'node:process';
import { defineNitroConfig } from 'nitropack/config';

const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:48123';

export default defineNitroConfig({
  compatibilityDate: '2025-01-01',
  srcDir: '.',
  scanDirs: ['routes'],
  devServer: {
    watch: [],
  },
  routeRules: {
    '/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-CSRFToken, Cookie',
        'Access-Control-Allow-Credentials': 'true',
      },
    },
  },
});
