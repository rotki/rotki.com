import { z } from 'zod';
import { isOnlyDigits, PASSWORD_MIN_LENGTH } from '~/utils/validation';

/** Field schemas shared by the account forms, with their messages translated. */
export function useFormRules() {
  const { t } = useI18n({ useScope: 'global' });

  /** A string that is not blank. */
  function required(message: string = t('validation.required')): z.ZodString {
    return z.string().trim().min(1, { error: message });
  }

  /** A required, well-formed e-mail address. */
  function email(invalid: string = t('validation.email')) {
    return required(invalid).pipe(z.email({ error: invalid }));
  }

  /**
   * The password checks the browser can run. The backend also rejects common passwords and ones
   * too close to the username or e-mail, which only it can check.
   */
  function password() {
    return z.string()
      .min(1, { error: t('validation.required') })
      .min(PASSWORD_MIN_LENGTH, { error: t('validation.password_too_short') })
      .refine(value => !isOnlyDigits(value), { error: t('validation.password_only_digits') });
  }

  return { email, password, required };
}
