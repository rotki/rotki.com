import type { Ref } from 'vue';
import { get, refAutoReset, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useVatCheck } from '~/modules/checkout/composables/use-vat-check';
import { useMainStore } from '~/store';
import { VatIdStatus } from '~/types/account';

/** How long a verification result stays under the field. */
const MESSAGE_DURATION_MS = 3000;

interface UseVatVerificationReturn {
  /** True while the save and the check run. */
  checking: Readonly<Ref<boolean>>;
  /** Seconds until the backend allows the next check, 0 when it does. */
  remainingTime: Readonly<Ref<number>>;
  successMessage: Readonly<Ref<string>>;
  errorMessage: Readonly<Ref<string>>;
  /** Saves the VAT ID with `save`, then has the backend check it. */
  verify: () => Promise<void>;
}

/**
 * Checks the saved VAT ID with the backend, which limits how often it can be asked. The wait it
 * returns is kept in local storage, so a reload does not reset the countdown.
 */
export function useVatVerification(save: () => Promise<boolean>): UseVatVerificationReturn {
  const { t } = useI18n({ useScope: 'global' });
  const { account } = storeToRefs(useMainStore());
  const { checkVAT, refreshVATCheckStatus } = useVatCheck();

  const checking = shallowRef<boolean>(false);
  const successMessage = refAutoReset<string>('', MESSAGE_DURATION_MS);
  const errorMessage = refAutoReset<string>('', MESSAGE_DURATION_MS);

  /** Unix seconds when the next check is allowed. */
  const waitUntil = useLocalStorage<number>('rotki.vat_check.wait_until_time', 0);
  const { timestamp, pause, resume } = useTimestamp({
    controls: true,
    scheduler: callback => useIntervalFn(callback, 1000),
  });

  const remainingTime = computed<number>(() => Math.max(0, (get(waitUntil) ?? 0) - Math.round(get(timestamp) / 1000)));

  // Only tick while there is a countdown to show
  watchImmediate(remainingTime, (seconds) => {
    if (seconds > 0)
      resume();
    else
      pause();
  });

  async function verify(): Promise<void> {
    set(checking, true);
    try {
      // The check reads the saved VAT ID, so there is nothing to check when the save failed.
      if (!await save())
        return;
      const result = await checkVAT();
      await refreshVATCheckStatus();

      if ('seconds' in result) {
        set(timestamp, Date.now());
        set(waitUntil, Math.round(Date.now() / 1000) + result.seconds);
      }
      else if (!result.success) {
        set(errorMessage, result.message);
      }
      else if (get(account)?.vatIdStatus === VatIdStatus.VALID) {
        set(successMessage, t('auth.signup.vat.verified'));
      }
    }
    finally {
      set(checking, false);
    }
  }

  return {
    checking: shallowReadonly(checking),
    errorMessage: shallowReadonly(errorMessage),
    remainingTime,
    successMessage: shallowReadonly(successMessage),
    verify,
  };
}
