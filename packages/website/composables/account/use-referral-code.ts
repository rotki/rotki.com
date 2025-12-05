import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type ReferralCodeResponse, ReferralCodeResponse as ReferralCodeResponseSchema } from '~/types';
import { logParseFailure } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

export function useReferralCode() {
  const logger = useLogger('referral-code');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const loading = ref<boolean>(false);
  const initialLoading = ref<boolean>(true);
  const referralData = ref<ReferralCodeResponse>();

  const hasReferralCode = computed<boolean>(() => {
    const data = get(referralData);
    return data?.hasReferral === true;
  });

  const referralCode = computed<string>(() => {
    const data = get(referralData);
    return data?.hasReferral === true ? data.code : '';
  });

  /**
   * Get referral code from API
   */
  const getReferralCode = async (): Promise<ReferralCodeResponse | undefined> => {
    try {
      const response = await fetchWithCsrf<ReferralCodeResponse>(
        '/webapi/2/referral',
        {
          method: 'GET',
        },
      );
      const parsed = ReferralCodeResponseSchema.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'referral code response', response, undefined);
      }
      return parsed.data;
    }
    catch (error) {
      logger.error('Failed to fetch referral code:', error);
      return undefined;
    }
  };

  /**
   * Create referral code via API
   */
  const createReferralCode = async (): Promise<ReferralCodeResponse | undefined> => {
    try {
      const response = await fetchWithCsrf<ReferralCodeResponse>(
        '/webapi/2/referral',
        {
          method: 'POST',
        },
      );
      const parsed = ReferralCodeResponseSchema.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'create referral code response', response, undefined);
      }
      return parsed.data;
    }
    catch (error) {
      logger.error('Failed to create referral code:', error);
      return undefined;
    }
  };

  const loadReferralCode = async (): Promise<void> => {
    set(loading, true);
    try {
      const data = await getReferralCode();
      if (data) {
        set(referralData, data);
      }
    }
    finally {
      set(loading, false);
      set(initialLoading, false);
    }
  };

  const createCode = async (): Promise<void> => {
    set(loading, true);
    try {
      const data = await createReferralCode();
      if (data) {
        set(referralData, data);
      }
    }
    finally {
      set(loading, false);
    }
  };

  return {
    createCode,
    hasReferralCode: readonly(hasReferralCode),
    initialLoading: readonly(initialLoading),
    loadReferralCode,
    loading: readonly(loading),
    referralCode: readonly(referralCode),
    referralData: readonly(referralData),
  };
}
