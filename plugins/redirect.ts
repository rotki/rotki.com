export default defineNuxtPlugin(() => {
  addRouteMiddleware((to) => {
    if (to.path === '/home') {
      return navigateTo(
        { path: '/home/subscription' },
        { redirectCode: 301, replace: true },
      );
    }
  });
});
