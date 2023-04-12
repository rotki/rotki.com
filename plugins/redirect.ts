export default defineNuxtPlugin(() => {
  addRouteMiddleware((to) => {
    if (to.path === '/products/detail') {
      return navigateTo(
        { name: 'products-details' },
        { redirectCode: 301, replace: true }
      );
    }
  });
});
