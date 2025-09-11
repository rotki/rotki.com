import type { Client } from 'braintree-web';
import type { HostedFieldFieldOptions, HostedFields } from 'braintree-web/hosted-fields';
import type { PayPalCheckout } from 'braintree-web/paypal-checkout';
import type { ThreeDSecure, ThreeDSecureCreateOptions } from 'braintree-web/three-d-secure';
import type { VaultManager } from 'braintree-web/vault-manager';
import { set } from '@vueuse/core';

// Braintree Web SDK version
const BRAINTREE_VERSION = '3.129.0';

// Module types
export type BraintreeModule = 'client' | 'hosted-fields' | 'paypal-checkout' | 'three-d-secure' | 'vault-manager';

// Module configurations with SRI hashes
const MODULE_CONFIGS: Record<BraintreeModule, { integrity: string; src: string }> = {
  'client': {
    integrity: 'sha384-AgL6VzrNZOZab0Q8pi2fCNZEJ2iJLEEA8SG4Ilg3OrUGAz9uddl36T/YPZQpEz1g',
    src: `https://js.braintreegateway.com/web/${BRAINTREE_VERSION}/js/client.min.js`,
  },
  'hosted-fields': {
    integrity: 'sha384-Cc5ZBRJTt+O1UWWLiyta+QI1yCjHU4Mq7RUa4fOf0Iut34R7VDfv32k+jv3paktg',
    src: `https://js.braintreegateway.com/web/${BRAINTREE_VERSION}/js/hosted-fields.min.js`,
  },
  'paypal-checkout': {
    integrity: 'sha384-gwPHdr53mnwNapz1NI4wc3pcYvwuEOylNRaMgaiTTS234aMIjWosCp8VeZK4zQOA',
    src: `https://js.braintreegateway.com/web/${BRAINTREE_VERSION}/js/paypal-checkout.min.js`,
  },
  'three-d-secure': {
    integrity: 'sha384-R0stI32Oey6vnfrLXoWQLXhKR0Xu8kAIXjDBEeLgMq2vh9IaaCKmoJQLTd4W7dRQ',
    src: `https://js.braintreegateway.com/web/${BRAINTREE_VERSION}/js/three-d-secure.min.js`,
  },
  'vault-manager': {
    integrity: 'sha384-CKA2AlHVezHXrtt/ZuQVGnW5mxlN4FktexJGU+eQvZ+fkxbqns6Kal8biw687HZv',
    src: `https://js.braintreegateway.com/web/${BRAINTREE_VERSION}/js/vault-manager.min.js`,
  },
};

// Module dependencies for different payment methods
const PAYMENT_METHOD_MODULES: Record<string, BraintreeModule[]> = {
  'card': ['client', 'hosted-fields', 'three-d-secure', 'vault-manager'],
  'paypal': ['client', 'paypal-checkout'],
  'three-d-secure': ['client', 'three-d-secure'], // Just for 3D Secure verification
};

// Official Braintree option types
interface BraintreeHostedFieldsOptions {
  client?: Client;
  authorization?: string;
  fields: HostedFieldFieldOptions;
  styles?: any;
}

interface BraintreePayPalOptions {
  client?: Client;
  authorization?: string;
  displayName?: string;
}

interface BraintreeVaultManagerOptions {
  client?: Client;
  authorization?: string;
}

// Enhanced global type declaration for Braintree with official types
declare global {
  interface Window {
    braintree?: {
      client?: {
        create: (options: { authorization: string }) => Promise<Client>;
      };
      hostedFields?: {
        create: (options: BraintreeHostedFieldsOptions) => Promise<HostedFields>;
      };
      paypalCheckout?: {
        create: (options: BraintreePayPalOptions) => Promise<PayPalCheckout>;
      };
      threeDSecure?: {
        create: (options: ThreeDSecureCreateOptions) => Promise<ThreeDSecure>;
      };
      vaultManager?: {
        create: (options: BraintreeVaultManagerOptions) => Promise<VaultManager>;
      };
    };
  }
}

interface BraintreeScriptState {
  error: Ref<Error | null>;
  loading: Ref<boolean>;
  ready: Ref<boolean>;
}

// Track loaded modules globally with cleanup
const loadedModules = new Set<BraintreeModule>();
const loadingStates = new Map<string, BraintreeScriptState>();
const moduleLoadPromises = new Map<BraintreeModule, Promise<void>>();

// Cleanup inactive states after 5 minutes
let cleanupTimer: NodeJS.Timeout | null = null;

function scheduleCleanup() {
  if (cleanupTimer)
    clearTimeout(cleanupTimer);

  cleanupTimer = setTimeout(() => {
    // Only keep states that are still being used
    for (const [key, state] of loadingStates.entries()) {
      if (state.ready.value || state.error.value) {
        loadingStates.delete(key);
      }
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Load specific Braintree modules based on payment method with optimizations
 */
export function useBraintreeScript(paymentMethod: 'card' | 'paypal' | 'three-d-secure'): BraintreeScriptState {
  const stateKey = paymentMethod;

  // Return existing state if available
  if (loadingStates.has(stateKey)) {
    return loadingStates.get(stateKey)!;
  }

  const error = ref<Error | null>(null);
  const loading = ref<boolean>(true);
  const ready = ref<boolean>(false);

  const requiredModules = PAYMENT_METHOD_MODULES[paymentMethod];
  if (!requiredModules) {
    const errorMsg = `Unknown payment method: ${paymentMethod}`;
    console.error(errorMsg);
    set(error, new Error(errorMsg));
    set(loading, false);
    const state = { error, loading, ready };
    loadingStates.set(stateKey, state);
    scheduleCleanup();
    return state;
  }

  const modulesToLoad = requiredModules.filter(mod => !loadedModules.has(mod));

  // Fast path: all modules already loaded and available
  if (modulesToLoad.length === 0 && checkModulesAvailable(requiredModules)) {
    set(loading, false);
    set(ready, true);
    const state = { error, loading, ready };
    loadingStates.set(stateKey, state);
    scheduleCleanup();
    return state;
  }

  // Load modules in parallel with shared promises
  const modulePromises = modulesToLoad.map(async (moduleName) => {
    // Reuse existing load promise if available
    if (moduleLoadPromises.has(moduleName)) {
      return moduleLoadPromises.get(moduleName)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const config = MODULE_CONFIGS[moduleName];
      const { onError, onLoaded } = useScript({
        crossorigin: 'anonymous',
        defer: true,
        integrity: config.integrity,
        src: config.src,
      });

      onError((scriptError) => {
        const errorMsg = `Failed to load Braintree ${moduleName} module`;
        console.error(errorMsg, scriptError);
        reject(new Error(errorMsg));
      });

      onLoaded(() => {
        loadedModules.add(moduleName);
        resolve();
      });
    });

    moduleLoadPromises.set(moduleName, promise);
    return promise;
  });

  const state = { error, loading, ready };

  // Wait for all modules to load
  Promise.all(modulePromises)
    .then(() => handleModulesLoaded(state, requiredModules))
    .catch(loadError => handleLoadError(state, loadError));
  loadingStates.set(stateKey, state);
  scheduleCleanup();
  return state;
}

/**
 * Handle successful module loading with exponential backoff readiness check
 */
function handleModulesLoaded(
  state: BraintreeScriptState,
  requiredModules: BraintreeModule[],
): void {
  set(state.loading, false);

  // Exponential backoff for module availability check
  let attempts = 0;
  const maxAttempts = 10;

  const checkReady = (): void => {
    attempts++;

    if (checkModulesAvailable(requiredModules)) {
      set(state.ready, true);
      return;
    }

    if (attempts < maxAttempts) {
      // Exponential backoff: 50ms, 100ms, 200ms, etc.
      const delay = Math.min(50 * (2 ** (attempts - 1)), 1000);
      setTimeout(checkReady, delay);
    }
    else {
      const errorMsg = 'Braintree modules loaded but failed to initialize properly';
      console.error(errorMsg, {
        attempts,
        braintree: window.braintree,
        requiredModules,
      });
      set(state.error, new Error(errorMsg));
    }
  };
  // Small delay to let scripts attach to window
  setTimeout(checkReady, 10);
}

/**
 * Handle module loading errors
 */
function handleLoadError(
  state: BraintreeScriptState,
  loadError: Error,
): void {
  set(state.loading, false);
  set(state.error, loadError);
}

/**
 * Check if specific modules are available on the window object
 * Optimized with early returns and better error handling
 */
function checkModulesAvailable(modules: BraintreeModule[]): boolean {
  if (!import.meta.client || typeof window === 'undefined' || !window.braintree) {
    return false;
  }

  const moduleCheckers: Record<BraintreeModule, () => boolean> = {
    'client': () => !!window.braintree?.client,
    'hosted-fields': () => !!window.braintree?.hostedFields,
    'paypal-checkout': () => !!window.braintree?.paypalCheckout,
    'three-d-secure': () => !!window.braintree?.threeDSecure,
    'vault-manager': () => !!window.braintree?.vaultManager,
  };

  return modules.every((module) => {
    const checker = moduleCheckers[module];
    if (!checker) {
      console.warn(`Unknown Braintree module: ${module}`);
      return false;
    }
    return checker();
  });
}

/**
 * Get the Braintree client factory (with enhanced safety checks)
 */
export function getBraintreeClient() {
  if (!import.meta.client || typeof window === 'undefined') {
    throw new Error('Braintree client can only be accessed on the client side');
  }
  if (!window.braintree?.client?.create) {
    throw new Error('Braintree client not loaded or incomplete. Ensure useBraintreeScript(\'card\') is called and ready.');
  }
  return window.braintree.client;
}

/**
 * Get Braintree hosted fields (with enhanced safety checks)
 */
export function getBraintreeHostedFields() {
  if (!import.meta.client || typeof window === 'undefined') {
    throw new Error('Braintree hostedFields can only be accessed on the client side');
  }
  if (!window.braintree?.hostedFields?.create) {
    throw new Error('Braintree hostedFields not loaded or incomplete. Ensure useBraintreeScript(\'card\') is called and ready.');
  }
  return window.braintree.hostedFields;
}

/**
 * Get Braintree PayPal checkout (with enhanced safety checks)
 */
export function getBraintreePayPal() {
  if (!import.meta.client || typeof window === 'undefined') {
    throw new Error('Braintree PayPal can only be accessed on the client side');
  }
  if (!window.braintree?.paypalCheckout?.create) {
    throw new Error('Braintree PayPal not loaded or incomplete. Ensure useBraintreeScript(\'paypal\') is called and ready.');
  }
  return window.braintree.paypalCheckout;
}

/**
 * Get Braintree 3D Secure (with enhanced safety checks)
 */
export function getBraintreeThreeDSecure() {
  if (!import.meta.client || typeof window === 'undefined') {
    throw new Error('Braintree 3D Secure can only be accessed on the client side');
  }
  if (!window.braintree?.threeDSecure?.create) {
    throw new Error('Braintree 3D Secure not loaded or incomplete. Ensure useBraintreeScript(\'card\') or useBraintreeScript(\'three-d-secure\') is called and ready.');
  }
  return window.braintree.threeDSecure;
}

/**
 * Get Braintree Vault Manager (with enhanced safety checks)
 */
export function getBraintreeVaultManager() {
  if (!import.meta.client || typeof window === 'undefined') {
    throw new Error('Braintree VaultManager can only be accessed on the client side');
  }
  if (!window.braintree?.vaultManager?.create) {
    throw new Error('Braintree VaultManager not loaded or incomplete. Ensure useBraintreeScript(\'card\') is called and ready.');
  }
  return window.braintree.vaultManager;
}
