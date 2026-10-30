import type { BaseValidation } from '@vuelidate/core';
import { minLength, required } from '@vuelidate/validators';
import { get } from '@vueuse/shared';

export const PASSWORD_MIN_LENGTH = 8;

/** True for a non-empty password made only of digits, which the backend rejects. */
export function isOnlyDigits(password: string): boolean {
  return /^\d+$/.test(password);
}

/**
 * The password checks the browser can run. The backend also rejects common passwords and ones
 * too close to the username or e-mail, which only it can check.
 */
export const passwordValidators = {
  required,
  minLength: minLength(PASSWORD_MIN_LENGTH),
  notOnlyDigits: (value: string): boolean => !isOnlyDigits(value),
};

/**
 * Converts an object of vuelidate's BaseValidation to an array of
 * strings to be passed to the components error-messages
 *
 * @param validation - The vuelidate validation object
 * @returns The error messages
 */
export function toMessages(validation: BaseValidation): string[] {
  return validation.$errors.map(e => get(e.$message));
}
