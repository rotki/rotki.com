<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal';
    invalid?: boolean;
    useRecaptchaNet?: boolean;
  }>(),
  {
    theme: 'light',
    size: 'normal',
    useRecaptchaNet: false,
  },
);

const emit = defineEmits<{
  (e: 'error'): void;
  (e: 'expired'): void;
  (e: 'success', value: string): void;
  (e: 'captcha-id', value: number): void;
}>();

const css = useCssModule();

const {
  public: {
    recaptcha: { siteKey },
  },
} = useRuntimeConfig();

const recaptchaEl = ref<HTMLElement>();
const rendered = ref(false);

// this will be populated once the deferred captcha script is loaded
const grecaptcha = toRef(window, 'grecaptcha');

/**
 * Renders the captcha if not rendered and required fields are available
 */
function renderCaptcha() {
  if (rendered.value || !(grecaptcha.value && recaptchaEl.value))
    return;

  const id = grecaptcha.value.render(recaptchaEl.value, {
    'sitekey': siteKey,
    'callback': (token: string) => emit('success', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
    'theme': props.theme,
    'size': props.size,
  });

  emit('captcha-id', id);
  rendered.value = true;
}

window.onRecaptchaLoaded = renderCaptcha;

onMounted(() => {
  if (!grecaptcha.value) {
    useHead({
      script: [
        {
          src: `${
            props.useRecaptchaNet
              ? 'https://www.recaptcha.net/recaptcha'
              : 'https://www.google.com/recaptcha'
          }/api.js?onload=onRecaptchaLoaded&render=explicit`,
          defer: true,
          async: true,
        },
      ],
    });
  }
  else {
    nextTick(renderCaptcha);
  }
});
</script>

<template>
  <div :class="css.wrapper">
    <div
      ref="recaptchaEl"
      :class="css.recaptcha"
    />

    <p
      v-if="invalid"
      :class="css.error"
    >
      Invalid or expired captcha, please try again
    </p>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply mt-4;

  .recaptcha {
    @apply h-20;
  }
}

.error {
  @apply text-xs text-[#e53935] mt-2;
}
</style>
