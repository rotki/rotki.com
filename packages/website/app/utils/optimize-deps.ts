/**
 * Dependencies the dev server pre-bundles before the first request.
 *
 * @remarks
 * Vite's startup scan misses subpath and deep imports, and a dependency it only discovers
 * mid-session makes the dev server re-optimize and force a full reload. A reload that lands
 * during hydration breaks the page (the sponsor mint page failed with "Cannot read properties of
 * null (reading 'ce')"), so every runtime import of these libraries is listed, including the
 * heavy route-specific web3 and payment ones, at the cost of a slower dev cold start.
 * Dev-only: this has no effect on the production build.
 */
export const devOptimizeDeps: string[] = [
  '@rotki/ui-library',
  '@rotki/ui-library/components',
  '@rotki/ui-library/composables',
  '@vue/devtools-core',
  '@vue/devtools-kit',
  '@vuelidate/core',
  '@vuelidate/validators',
  'zod',
  'plainfp',
  'plainfp/interop/zod',
  'plainfp/pipe',
  'plainfp/result',
  'plainfp/result-async',
  'plainfp/tagged',
  'swiper/vue',
  'swiper/modules',
  'qrcode',
  'viem',
  'viem/chains',
  'viem/op-stack',
  'viem/siwe',
  '@wagmi/core',
  '@wagmi/connectors',
  '@walletconnect/universal-provider',
  '@coinbase/wallet-sdk',
  'braintree-web',
  'braintree-web/client',
  'braintree-web/hosted-fields',
  'braintree-web/paypal-checkout',
  'braintree-web/three-d-secure',
  'braintree-web/vault-manager',
];
