import { get, set } from '@vueuse/shared';

export function useRecaptcha() {
  const recaptchaPassed = shallowRef<boolean>(false);
  const recaptchaToken = shallowRef<string>('');
  const captchaId = ref<number>();

  const onSuccess = (token: string): void => {
    set(recaptchaToken, token);
    set(recaptchaPassed, true);
  };

  const onExpired = (): void => {
    set(recaptchaToken, '');
    set(recaptchaPassed, false);
  };

  const onError = (): void => {
    set(recaptchaPassed, false);
  };

  const resetCaptcha = (): void => {
    onExpired();
    if (typeof window !== 'undefined')
      window.grecaptcha?.reset(get(captchaId));
  };

  return {
    captchaId,
    onError,
    onExpired,
    onSuccess,
    recaptchaPassed: readonly(recaptchaPassed),
    recaptchaToken: readonly(recaptchaToken),
    resetCaptcha,
  };
}
