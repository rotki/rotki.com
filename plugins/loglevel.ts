import consola from 'consola';

export default defineNuxtPlugin({
  hooks: {
    // You can directly register Nuxt app runtime hooks here
    'app:created': function () {
      const nuxtApp = useNuxtApp();
      consola.level = nuxtApp.$config.public.loglevel;
    },
  },
});
