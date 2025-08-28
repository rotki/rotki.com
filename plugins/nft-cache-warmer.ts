import { consola } from 'consola';
import { warmNftCache } from '~/composables/rotki-sponsorship/cache-warmer';

export default defineNuxtPlugin({
  hooks: {
    // You can directly register Nuxt app runtime hooks here
    'app:created': function () {
      if (!import.meta.server) {
        return;
      }

      warmNftCache().catch((error) => {
        consola.error('Failed to warm NFT cache:', error);
      });
    },
  },
});
