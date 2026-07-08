import type { SimpleTokenMetadata, TierKey } from '~/modules/web3/sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { get, set } from '@vueuse/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { type NftSubmissionFormContext, useNftSubmissionForm } from '~/modules/web3/sponsorship/use-nft-submission-form';

const TEST_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const CURRENT_RELEASE_ID = 1;

// The two on-chain-adjacent lookups the form performs on token change. Both are
// controllable per-test so we can hold `checkExistingSubmission` open and drive
// the race where the user types while it is still pending.
const mockMetadata = ref<SimpleTokenMetadata | undefined>();
let existingSubmission: NftSubmission | undefined;
let deferredCheck: { promise: Promise<NftSubmission | undefined>; resolve: () => void };

function deferCheck(): void {
  let resolve!: () => void;
  const promise = new Promise<NftSubmission | undefined>((res) => {
    resolve = () => res(existingSubmission);
  });
  deferredCheck = { promise, resolve };
}

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({ fetchWithCsrf: vi.fn(), setHooks: vi.fn() }),
}));
vi.mock('~/modules/web3/sponsorship/use-nft-metadata', () => ({
  useNftMetadata: () => ({ fetchNftMetadata: async () => get(mockMetadata) }),
}));
vi.mock('~/modules/web3/sponsorship/use-nft-submissions', () => ({
  useNftSubmissions: () => ({ checkSubmissionByNftId: async () => deferredCheck.promise }),
}));
vi.mock('~/modules/web3/sponsorship/use-payment', () => ({
  useRotkiSponsorshipPayment: () => ({ currentAddressNfts: ref([]) }),
}));
vi.mock('~/modules/web3/sponsorship/use-siwe-auth', () => ({
  useSiweAuth: () => ({
    authenticatedRequest: vi.fn(),
    isAuthenticating: ref(false),
    isSessionValid: () => true,
  }),
}));
vi.mock('~/modules/web3/sponsorship/use-sponsorship', () => ({
  useSponsorshipData: () => ({ data: ref({ releaseId: CURRENT_RELEASE_ID, releaseName: 'v1' }) }),
}));
vi.mock('~/utils/use-logger', () => ({
  useLogger: () => ({ debug: vi.fn(), error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}));

type Form = ReturnType<typeof useNftSubmissionForm>;

async function setupForm(editing?: NftSubmission): Promise<Form> {
  let api: Form | undefined;
  const editingRef = ref<NftSubmission | undefined>(editing);
  const context: NftSubmissionFormContext = {
    address: () => TEST_ADDRESS,
    editingSubmission: () => get(editingRef),
    emit: () => {},
    isConnected: () => true,
  };
  const Wrapper = defineComponent({
    setup() {
      api = useNftSubmissionForm(context);
      return () => h('div');
    },
  });
  await mountSuspended(Wrapper);
  await nextTick();
  return api!;
}

function metadata(tier: TierKey, releaseId = CURRENT_RELEASE_ID): SimpleTokenMetadata {
  return { owner: TEST_ADDRESS, releaseId, releaseName: 'v1', tier };
}

function submitDisabled(form: Form): boolean {
  return !get(form.isAuthenticated) || get(form.v$).$invalid;
}

// Let the token-change watcher run fetchNftMetadata and reach (but not resolve)
// checkExistingSubmission.
async function flushMicrotasks(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
}

describe('useNftSubmissionForm submit-button gating', () => {
  beforeEach(() => {
    set(mockMetadata, undefined);
    existingSubmission = undefined;
    deferCheck();
  });

  it('keeps name + image the user typed while the existing-submission check is still in flight (gold)', async () => {
    // Regression: the image field only appears after the tier resolves, so silver/gold
    // users fill the form while checkExistingSubmission is pending. The deferred
    // no-submission branch used to wipe that input, leaving submit stuck disabled.
    set(mockMetadata, metadata('gold'));
    const form = await setupForm();

    set(form.modelTokenId, '5');
    await flushMicrotasks(); // tier resolved, image field visible, check still pending

    expect(get(form.nftTier)).toBe('gold');

    set(form.modelDisplayName, 'Alice');
    form.handleImageSelected(new File(['x'], 'a.png', { type: 'image/png' }));
    await nextTick();
    expect(submitDisabled(form)).toBe(false);

    deferredCheck.resolve(); // no existing submission
    await flushMicrotasks();

    expect(get(form.modelDisplayName)).toBe('Alice');
    expect(submitDisabled(form)).toBe(false);
  });

  it('enables submit for a bronze NFT once a name is entered', async () => {
    set(mockMetadata, metadata('bronze'));
    const form = await setupForm();

    set(form.modelTokenId, '7');
    deferredCheck.resolve();
    await flushMicrotasks();

    set(form.modelDisplayName, 'Bob');
    await nextTick();

    expect(submitDisabled(form)).toBe(false);
  });

  it('clears leftover prefill when switching from a submitted NFT to a fresh one', async () => {
    // First token has a submission -> form prefills. Switching to a fresh token must
    // drop that stale prefill instead of carrying it over.
    existingSubmission = {
      createdAt: '2026-01-01',
      displayName: 'Old Name',
      email: null,
      imageUrl: null,
      nftId: 5,
      updatedAt: '2026-01-01',
    };
    set(mockMetadata, metadata('gold'));
    const form = await setupForm();

    set(form.modelTokenId, '5');
    deferredCheck.resolve();
    await flushMicrotasks();
    expect(get(form.modelDisplayName)).toBe('Old Name');

    // Switch to a different, submission-free NFT.
    existingSubmission = undefined;
    deferCheck();
    set(form.modelTokenId, '9');
    await nextTick(); // synchronous reset happens before the async check
    expect(get(form.modelDisplayName)).toBe('');

    deferredCheck.resolve();
    await flushMicrotasks();
    expect(get(form.modelDisplayName)).toBe('');
  });

  it('preserves an edited submission prefill for a past-release NFT (no ok re-check)', async () => {
    // Guards the earlier edit fix: editing an NFT from a previous release never reaches
    // the ok branch, so the synchronous reset must skip the token being edited.
    const editing: NftSubmission = {
      createdAt: '2026-01-01',
      displayName: 'Edited Name',
      email: null,
      imageUrl: null,
      nftId: 42,
      releaseVersion: 'v0',
      updatedAt: '2026-01-01',
    };
    set(mockMetadata, metadata('silver', CURRENT_RELEASE_ID + 1)); // wrong_release
    const form = await setupForm(editing);
    await flushMicrotasks();

    expect(get(form.modelTokenId)).toBe('42');
    expect(get(form.modelDisplayName)).toBe('Edited Name');
    // Editing is never gated on the live ownership re-check: submit stays enabled
    // for a past-release NFT (the submit flow skips ownership when editing).
    expect(submitDisabled(form)).toBe(false);
  });
});
