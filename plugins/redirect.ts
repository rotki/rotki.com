export default defineNuxtPlugin(() => {
  addRouteMiddleware((to) => {
    if (to.path === '/products/detail') {
      return navigateTo(
        { name: 'products-details' },
        { redirectCode: 301, replace: true },
      );
    }

    if (to.path === '/home') {
      return navigateTo(
        { path: '/home/subscription' },
        { redirectCode: 301, replace: true },
      );
    }
  });
});
