import type { ShallowRef } from 'vue';
import { createSharedComposable } from '@vueuse/core';

export interface SharedWeb3State {
  address: ShallowRef<string | undefined>;
  connected: ShallowRef<boolean>;
  connectedChainId: ShallowRef<bigint | undefined>;
  initialized: ShallowRef<boolean>;
  initializing: ShallowRef<boolean>;
  isOpen: ShallowRef<boolean>;
}

/**
 * Shared web3 connection state. All callers of useWeb3Connection() share the same
 * reactive refs, preventing state desync when multiple composables create their own instance.
 */
export const useSharedWeb3State = createSharedComposable((): SharedWeb3State => ({
  address: shallowRef<string>(),
  connected: shallowRef<boolean>(false),
  connectedChainId: shallowRef<bigint>(),
  initialized: shallowRef<boolean>(false),
  initializing: shallowRef<boolean>(false),
  isOpen: shallowRef<boolean>(false),
}));
