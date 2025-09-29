import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import { APP_BASE_PATH } from './src/config/paths';

// https://vite.dev/config/
export default defineConfig({
  base: APP_BASE_PATH,
  build: {
    cssCodeSplit: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('braintree-web')) {
            return 'braintree';
          }
          if (id.includes('vue') && !id.includes('vueuse')) {
            return 'vue';
          }
          if (id.includes('zod')) {
            return 'zod';
          }
        },
      },
    },
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_debugger: true,
      },
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      '@vueuse/core',
      'braintree-web',
      'zod',
      '@rotki/ui-library/theme',
    ],
  },
  plugins: [
    ...(process.env.NODE_ENV === 'development' ? [vueDevTools()] : []),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false,
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 3001,
    proxy: {
      '/webapi': {
        changeOrigin: true,
        secure: false,
        target: process.env.WEBAPI_URL || 'http://127.0.0.1:8000',
      },
    },
  },
  ssgOptions: {
    crittersOptions: {
      reduceInlineStyles: false,
    },
    formatting: 'minify',
    script: 'async',
  },
});
