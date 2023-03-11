export const useRecaptcha = () => {
  const recaptchaPassed = ref(false);
  const recaptchaToken = ref('');
  const onSuccess = (token: string) => {
    recaptchaToken.value = token;
    recaptchaPassed.value = true;
  };
  const onExpired = () => {
    recaptchaToken.value = '';
    recaptchaPassed.value = false;
  };
  const onError = () => {
    recaptchaPassed.value = false;
  };
  return {
    recaptchaPassed,
    recaptchaToken,
    onSuccess,
    onExpired,
    onError,
  };
};
