import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { onMounted, onUnmounted, type Ref, shallowReadonly, shallowRef } from 'vue';

export interface UseBraintreeClientReturn {
  client: Readonly<Ref<Client | undefined>>;
}

/**
 * The Braintree client of the card page, created on mount and torn down on unmount.
 * `onError` gets the error when the client cannot be created: without it no card
 * field or saved card works, so the caller shows a page-level error.
 */
export function useBraintreeClient(authorization: string | undefined, onError: (error: unknown) => void): UseBraintreeClientReturn {
  const client = shallowRef<Client>();

  onMounted(async () => {
    try {
      if (!authorization)
        throw new Error('Braintree client token not available');
      set(client, await create({ authorization }));
    }
    catch (error) {
      console.error(error);
      onError(error);
    }
  });

  onUnmounted(() => {
    get(client)?.teardown((error) => {
      if (error)
        console.error('Error during cleanup:', error);
    });
  });

  return { client: shallowReadonly(client) };
}
