import type { PendingTx } from '~/types';

/**
 * Shared composable for managing pending crypto transaction state in localStorage.
 * This is kept separate from crypto-payment.ts to avoid pulling in web3 dependencies
 * when only the pending tx state is needed.
 */
export const usePendingTx = createSharedComposable(() => useLocalStorage<PendingTx>('rotki.pending_tx', null, {
  serializer: {
    read: (v: any): any => (v ? JSON.parse(v) : null),
    write: (v: any): string => JSON.stringify(v),
  },
}));
