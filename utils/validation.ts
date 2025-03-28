import type { BaseValidation } from '@vuelidate/core';
import { get } from '@vueuse/core';

/**
 * Converts an object of vuelidate's BaseValidation to an array of
 * strings to be passed to the components error-messages
 *
 * @param validation BaseValidation
 * @return string[]
 */
export function toMessages(validation: BaseValidation): string[] {
  return validation.$errors.map(e => get(e.$message));
}
