import type { ComposerTranslation } from 'vue-i18n';
import type { DeleteAccountPayload, PasswordChangePayload, ProfilePayload } from '~/types/account';
import type { ActionResult } from '~/types/common';
import { type Account, AccountSchema } from '@rotki/card-payment-common/schemas/account';
import {
  type ActionResultResponse,
  ActionResultResponseSchema,
  type ApiResponse,
} from '@rotki/card-payment-common/schemas/api';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  ApiKeys,
  ChangePasswordResponse,
  ResendVerificationResponse,
  UpdateProfileResponse,
} from '~/types';
import { createErrorResult, createSuccessResult, isUnauthorizedError, logParseFailure } from '~/utils/api-error-handling';
import { formatSeconds } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

/**
 * Account management API composable
 * Handles account CRUD operations, profile updates, and email verification
 */
export function useAccountApi() {
  const logger = useLogger('account-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Fetch account data from API
   */
  const getAccount = async (): Promise<Account | undefined> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<Account>>(
        '/webapi/account/',
        {
          method: 'GET',
        },
      );
      const parsed = AccountSchema.safeParse(response.result);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'account response', response.result, undefined);
      }
      return parsed.data;
    }
    catch (error) {
      if (!isUnauthorizedError(error)) {
        logger.error('Failed to fetch account:', error);
      }
      return undefined;
    }
  };

  /**
   * Update user profile information
   */
  const updateProfile = async (payload: ProfilePayload): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<UpdateProfileResponse>(
        '/webapi/account/',
        {
          body: payload,
          method: 'PATCH',
        },
      );

      const parsed = UpdateProfileResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'update profile response', response, {
          message: 'Invalid response format',
          success: false,
        });
      }
      const { result } = parsed.data;
      if (result) {
        return createSuccessResult();
      }

      return {
        message: 'Update failed',
        success: false,
      };
    }
    catch (error: any) {
      logger.error('Failed to update profile:', error);
      return createErrorResult(error);
    }
  };

  /**
   * Delete user account
   */
  const deleteAccount = async (payload: DeleteAccountPayload): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        '/webapi/account/',
        {
          body: payload,
          method: 'DELETE',
        },
      );

      const parsed = ActionResultResponseSchema.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'delete account response', response, {
          message: 'Invalid response format',
          success: false,
        });
      }
      const data = parsed.data;
      return {
        message: data.message,
        success: data.result ?? false,
      };
    }
    catch (error: any) {
      logger.error('Failed to delete account:', error);
      return createErrorResult(error);
    }
  };

  /**
   * Regenerate API keys
   */
  const updateKeys = async (): Promise<ApiKeys | null> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<ApiKeys>>(
        '/webapi/regenerate-keys/',
        {
          method: 'PATCH',
        },
      );
      const parsed = ApiKeys.safeParse(response.result);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'API keys response', response.result, null);
      }
      return parsed.data;
    }
    catch (error) {
      logger.error('Failed to update API keys:', error);
      return null;
    }
  };

  /**
   * Change user password
   */
  const changePassword = async (payload: PasswordChangePayload): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<ChangePasswordResponse>(
        '/webapi/change-password/',
        {
          body: payload,
          method: 'PATCH',
        },
      );
      const parsed = ChangePasswordResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'change password response', response, {
          message: 'Invalid response format',
          success: false,
        });
      }
      const data = parsed.data;
      return {
        message: '',
        success: data.result ?? false,
      };
    }
    catch (error: any) {
      logger.error('Failed to change password:', error);
      return createErrorResult(error);
    }
  };

  /**
   * Resend email verification code
   */
  const resendVerificationCode = async (t: ComposerTranslation): Promise<ActionResult> => {
    const onError = (data: ResendVerificationResponse) => {
      let message = data.message;
      if (isDefined(data.allowedIn)) {
        const formatted = formatSeconds(data.allowedIn);
        const formattedMessage = [];
        if (formatted.minutes) {
          formattedMessage.push(t('account.unverified_email.message.time.minutes', { number: formatted.minutes }));
        }

        if (formatted.seconds) {
          formattedMessage.push(t('account.unverified_email.message.time.seconds', { number: formatted.seconds }));
        }

        message += `\n${t('account.unverified_email.message.try_again', {
          time: formattedMessage.join(' '),
        })}`;
      }

      return {
        message,
        success: false,
      };
    };

    try {
      const response = await fetchWithCsrf<ResendVerificationResponse>(
        '/webapi/email-verification/',
        {
          method: 'GET',
        },
      );

      const parsed = ResendVerificationResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'resend verification response', response, {
          message: 'Invalid response format',
          success: false,
        });
      }
      const data = parsed.data;
      if (data.result) {
        return createSuccessResult();
      }
      else {
        return onError(data);
      }
    }
    catch (error: any) {
      logger.error('Failed to resend verification code:', error);
      if (error instanceof FetchError) {
        const parsed = ResendVerificationResponse.safeParse(error.data);
        if (!parsed.success) {
          return logParseFailure(parsed, logger, 'error response for resend verification', error.data, createErrorResult(error));
        }
        return onError(parsed.data);
      }

      return createErrorResult(error);
    }
  };

  return {
    changePassword,
    deleteAccount,
    getAccount,
    resendVerificationCode,
    updateKeys,
    updateProfile,
  };
}
