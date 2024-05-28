export default defineNuxtPlugin(() => {
  addRouteMiddleware((to) => {
    if (to.path.startsWith('/products/detail')) {
      return navigateTo(
        { name: 'products' },
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
