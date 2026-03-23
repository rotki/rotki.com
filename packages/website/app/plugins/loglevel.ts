import { consola } from 'consola';

export default defineNuxtPlugin({
  hooks: {
    'app:created': function () {
      const nuxtApp = useNuxtApp();
      let level: number = nuxtApp.$config.public.loglevel;

      if (import.meta.client) {
        const stored = localStorage.getItem('consola_level');
        if (stored) {
          const parsed = Number.parseInt(stored, 10);
          if (!Number.isNaN(parsed))
            level = parsed;
        }
      }

      consola.level = level;
    },
  },
});
