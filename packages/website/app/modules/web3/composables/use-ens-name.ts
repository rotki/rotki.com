import type { MaybeRefOrGetter, Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { set } from '@vueuse/shared';
import { getOr } from 'plainfp/result';
import { peekEnsName } from '~/modules/web3/core/ens-cache';
import { useLogger } from '~/utils/use-logger';

export interface UseEnsNameReturn {
  /** The connected address' primary ENS name, or `undefined` when none/unresolved. */
  ensName: Readonly<Ref<string | undefined>>;
  /** True while a reverse lookup is in flight (incl. the debounce window). */
  loading: Readonly<Ref<boolean>>;
}

/**
 * Best-effort reverse-ENS lookup for a (reactive) address. Errors are swallowed (the
 * name is a cosmetic enhancement, never a blocker) — the card just keeps showing the
 * truncated address.
 *
 * An already-resolved name is seeded *synchronously* from the session cache (see
 * `core/ens-cache`, which is viem-free) so the card never flickers to the truncated
 * address before a known name appears. Only an actual network lookup is debounced (so
 * rapid address changes don't fan out RPC calls) and stale-guarded (so a slow response
 * for a previous address never overwrites a newer one). `core/ens` (and viem) is
 * dynamically imported on that path so it stays in an async chunk, off the initial bundle.
 */
export function useEnsName(address: MaybeRefOrGetter<string | undefined>): UseEnsNameReturn {
  const ensName = shallowRef<string>();
  const loading = shallowRef<boolean>(false);

  const logger = useLogger('ens-name');

  const lookup = useDebounceFn(async (owner: string): Promise<void> => {
    try {
      const { resolveEnsName } = await import('~/modules/web3/core/ens');
      const result = await resolveEnsName(owner);
      // A newer address arrived while this lookup was in flight — drop the result.
      if (toValue(address) !== owner)
        return;
      set(ensName, getOr(result, undefined));
    }
    catch (error) {
      logger.error('Failed to resolve ENS name:', error);
    }
    finally {
      // Only the lookup for the current address owns the loading flag.
      if (toValue(address) === owner)
        set(loading, false);
    }
  }, 300);

  watch(() => toValue(address), (owner) => {
    if (!owner) {
      set(ensName, undefined);
      set(loading, false);
      return;
    }

    // Already known — seed in the same tick so the card shows the name immediately.
    const cached = peekEnsName(owner);
    if (cached.hit) {
      set(ensName, cached.name);
      set(loading, false);
      return;
    }

    // Unknown address: blank any previous name and resolve in the background. The
    // lookup swallows its own errors, so the returned promise never rejects.
    set(ensName, undefined);
    set(loading, true);
    lookup(owner).catch(() => {});
  }, { immediate: true });

  return {
    ensName: shallowReadonly(ensName),
    loading: shallowReadonly(loading),
  };
}
