import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import WalletAccountSummary from '~/modules/web3/components/WalletAccountSummary.vue';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

const copy = vi.fn();
const copied = ref<boolean>(false);
const isSupported = ref<boolean>(true);

// Mock only useClipboard so the component never touches the real navigator.clipboard.
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');
  return {
    ...actual,
    useClipboard: () => ({ copied, copy, isSupported }),
  };
});

// Stub reverse-ENS resolution so the component never hits the network.
vi.mock('~/modules/web3/composables/use-ens-name', () => ({
  useEnsName: () => ({ ensName: ref<string>(), loading: ref<boolean>(false) }),
}));

async function mountSummary(props: Record<string, unknown> = {}) {
  return mountSuspended(WalletAccountSummary, {
    props: { address: ADDRESS, open: vi.fn(), ...props },
    global: { stubs: { AddressAvatar: true } },
  });
}

describe('walletAccountSummary', () => {
  beforeEach(() => {
    copy.mockClear();
    copied.value = false;
    isSupported.value = true;
  });

  it('renders the truncated address by default', async () => {
    const wrapper = await mountSummary();

    expect(wrapper.text()).toContain('0x1234...5678');
    expect(wrapper.text()).not.toContain(ADDRESS);
  });

  it('prefers the ENS name over the address when provided', async () => {
    const wrapper = await mountSummary({ ensName: 'rotki.eth' });

    expect(wrapper.text()).toContain('rotki.eth');
    expect(wrapper.text()).not.toContain('0x1234...5678');
  });

  it('passes the address (and ens) down to the avatar', async () => {
    const wrapper = await mountSummary({ ensName: 'rotki.eth' });

    const avatar = wrapper.findComponent({ name: 'AddressAvatar' });
    expect(avatar.props('address')).toBe(ADDRESS);
    expect(avatar.props('ensName')).toBe('rotki.eth');
  });

  it('copies the address when the copy button is clicked', async () => {
    const wrapper = await mountSummary();

    await wrapper.get('[aria-label="Copy address"]').trigger('click');

    expect(copy).toHaveBeenCalledTimes(1);
  });

  it('hides the copy button when clipboard is unsupported', async () => {
    isSupported.value = false;
    const wrapper = await mountSummary();

    expect(wrapper.find('[aria-label="Copy address"]').exists()).toBe(false);
  });

  it('invokes open when the change button is clicked', async () => {
    const open = vi.fn();
    const wrapper = await mountSummary({ open });

    const change = wrapper.findAll('button').find(button => button.text().includes('Change'));
    expect(change).toBeDefined();
    await change!.trigger('click');

    expect(open).toHaveBeenCalledTimes(1);
  });
});
