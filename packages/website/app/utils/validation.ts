export const PASSWORD_MIN_LENGTH = 8;

/** True for a non-empty password made only of digits, which the backend rejects. */
export function isOnlyDigits(password: string): boolean {
  return /^\d+$/.test(password);
}
