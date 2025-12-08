import type { RouteLocationRaw } from 'vue-router';

// Routes that require hard reloads due to special CSP configurations
const SPECIAL_CSP_ROUTES = [
  // Payment routes
  '/checkout/pay',
  '/checkout/pay/card',
  '/checkout/pay/crypto',
  '/checkout/pay/method',
  '/checkout/pay/paypal',
  '/checkout/pay/request-crypto',
  '/checkout/pay/3d-secure',
  // Account payment methods (requires 3DS CSP)
  '/home/payment-methods',
  // Auth routes
  '/signup',
  '/password/recover',
  // Sponsor routes
  '/sponsor',
] as const;

/**
 * Extract the base path from a route string, removing query params and hash
 */
function extractBasePath(routePath: string): string {
  // Remove query parameters and hash fragments
  return routePath.split(/[#?]/)[0] ?? routePath;
}

/**
 * Check if a route path matches a CSP route pattern
 */
function matchesCSPRoute(routePath: string, cspRoute: string): boolean {
  const basePath = extractBasePath(routePath);

  // Handle sponsor wildcard route
  if (cspRoute === '/sponsor') {
    return basePath === '/sponsor' || basePath.startsWith('/sponsor/');
  }

  // Exact match for other routes
  return basePath === cspRoute;
}

/**
 * Check if a route requires hard reload due to special CSP configuration
 */
export function requiresHardReload(route: RouteLocationRaw): boolean {
  let routePath: string;

  if (typeof route === 'string') {
    routePath = route;
  }
  else if (typeof route === 'object') {
    // Try to resolve the route using router if available
    try {
      const router = useRouter();
      const resolved = router.resolve(route);
      routePath = resolved.path;
    }
    catch {
      // Fallback to direct path if router is not available
      routePath = route.path || '/';
    }
  }
  else {
    return false;
  }

  return SPECIAL_CSP_ROUTES.some(cspRoute => matchesCSPRoute(routePath, cspRoute));
}

/**
 * Navigate to a route, using hard reload if required by CSP configuration
 */
export async function navigateToWithCSPSupport(to: RouteLocationRaw): Promise<void> {
  if (requiresHardReload(to)) {
    // Force hard reload for routes with special CSP configurations
    const router = useRouter();
    const resolved = router.resolve(to);
    window.location.href = resolved.href;
  }
  else {
    // Use normal SPA navigation
    await navigateTo(to);
  }
}
