import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useMainStore } from '~/store';
import { fetchWithCsrf } from '~/utils/api';
import type { ApiResponse } from '~/types';

interface VATCheckSuccess {
  readonly success: true;
}

interface VATCheckFailure {
  readonly success: false;
  readonly message: string;
}

type VATCheckResult = VATCheckSuccess | VATCheckFailure;

interface VATCheckRateLimited {
  readonly seconds: number;
}

interface UseVATCheckReturn {
  checkVAT: () => Promise<VATCheckResult | VATCheckRateLimited>;
  refreshVATCheckStatus: () => Promise<void>;
}

export function useVatCheck(): UseVATCheckReturn {
  const { account } = storeToRefs(useMainStore());

  const refreshVATCheckStatus = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<string>>(
        'webapi/account/vat',
        {
          method: 'GET',
        },
      );
      const { result } = response;
      if (result) {
        set(account, {
          ...get(account),
          vatIdStatus: result,
        });
      }
    }
    catch (error) {
      logger.error(error);
    }
  };

  /**
   * Asynchronous function to check the validity of a VAT (Value Added Tax) ID.
   *
   * @async
   * @function
   * @returns {Promise<VATCheckResult | VATCheckRateLimited>} Returns a promise that resolves to either a VATCheckResult object
   * containing the validation result and message, or a VATCheckRateLimited object indicating the rate limit status with remaining time.
   *
   * Possible return values:
   * - An object with `result: true` if the VAT ID check task was spawned successfully.
   * It provides no information about the validity of the VAT ID itself.
   * A check to the account's vat id status property is required.
   * - An object with `result: false` and a message if the VAT validation fails.
   * - A VATCheckRateLimited object with `seconds` indicating the number of seconds until the rate limit is lifted, in case of rate-limiting.
   * - A response with `message: 'Unknown error'` in case of unspecified errors.
   *
   * Handles potential errors during the fetch operation and logs them.
   */
  const checkVAT = async (): Promise<VATCheckResult | VATCheckRateLimited> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<boolean>>(
        'webapi/account/vat',
        {
          method: 'POST',
        },
      );
      if (response.result) {
        return { success: true };
      }

      return { message: response.message, success: false };
    }
    catch (error) {
      logger.error(error);
      if (error instanceof FetchError) {
        const status = error?.status || -1;
        const result = error.data.result;
        const isBadRequest = status === 400;
        if (isBadRequest) {
          if (typeof result === 'number') {
            return { seconds: result };
          }
          else if (error.data.message) {
            return { message: error.data.message, success: false };
          }
        }
      }
      return { message: 'Unknown error', success: false };
    }
  };

  return {
    checkVAT,
    refreshVATCheckStatus,
  };
}
