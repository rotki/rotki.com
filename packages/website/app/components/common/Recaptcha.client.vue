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
  'error': [];
  'expired': [];
  'success': [value: string];
  'captcha-id': [value: number];
}>();

const {
  public: {
    recaptcha: { siteKey },
  },
} = useRuntimeConfig();

const recaptchaEl = ref<HTMLElement>();
const rendered = ref(false);

// this will be populated once the deferred captcha script is loaded
const grecaptcha = toRef(window, 'grecaptcha');
const { t } = useI18n({ useScope: 'global' });

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
  <div class="mt-4">
    <div
      ref="recaptchaEl"
      class="h-20"
    />

    <p
      v-if="invalid"
      class="text-xs text-[#e53935] mt-2"
    >
      {{ t('recaptcha.expired_captcha') }}
    </p>
  </div>
</template>
