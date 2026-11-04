import { flushPromises, mount } from '@vue/test-utils';
import { create } from 'braintree-web/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useBraintreeClient, type UseBraintreeClientReturn } from './braintree-client';

const braintree = vi.hoisted(() => ({
  client: { teardown: vi.fn() },
  /** Runs before the client is returned; throw from it to make the load fail. */
  beforeCreate: vi.fn(),
}));

vi.mock('braintree-web/client', () => ({
  create: vi.fn(async () => {
    braintree.beforeCreate();
    return braintree.client;
  }),
}));

interface Mounted {
  result: UseBraintreeClientReturn;
  unmount: () => void;
  onError: ReturnType<typeof vi.fn>;
}

function mountWith(authorization: string | undefined): Mounted {
  const onError = vi.fn();
  let result: UseBraintreeClientReturn | undefined;
  const wrapper = mount(defineComponent({
    setup() {
      result = useBraintreeClient(authorization, onError);
      return () => h('div');
    },
  }));
  if (!result)
    throw new Error('composable did not run');
  return { result, unmount: () => wrapper.unmount(), onError };
}

describe('composables/braintree-client', () => {
  beforeEach(() => {
    vi.mocked(create).mockClear();
    braintree.client.teardown.mockReset();
    braintree.beforeCreate.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('creates the client on mount and tears it down on unmount', async () => {
    const { result, unmount } = mountWith('client-token');
    await flushPromises();

    expect(create).toHaveBeenCalledWith({ authorization: 'client-token' });
    expect(result.client.value).toStrictEqual(braintree.client);

    unmount();
    expect(braintree.client.teardown).toHaveBeenCalledOnce();
  });

  it('reports a missing token instead of throwing', async () => {
    const { result, onError } = mountWith(undefined);
    await flushPromises();

    expect(create).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledOnce();
    expect(result.client.value).toBeUndefined();
  });

  it('reports a client that fails to load', async () => {
    const failure = new Error('blocked');
    braintree.beforeCreate.mockImplementation(() => {
      throw failure;
    });

    const { onError } = mountWith('client-token');
    await flushPromises();

    expect(onError).toHaveBeenCalledWith(failure);
  });
});
