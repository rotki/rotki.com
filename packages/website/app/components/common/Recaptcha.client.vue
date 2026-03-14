<script setup lang="ts">
import { get, set } from '@vueuse/shared';

const { theme = 'light', size = 'normal', invalid = false, useRecaptchaNet = false } = defineProps<{
  theme?: 'light' | 'dark';
  size?: 'compact' | 'normal';
  invalid?: boolean;
  useRecaptchaNet?: boolean;
}>();

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

const rendered = ref<boolean>(false);
const recaptchaEl = useTemplateRef<HTMLElement>('recaptchaEl');

const { t } = useI18n({ useScope: 'global' });
// this will be populated once the deferred captcha script is loaded
const grecaptcha = toRef(window, 'grecaptcha');

/**
 * Renders the captcha if not rendered and required fields are available
 */
function renderCaptcha(): void {
  if (get(rendered) || !(get(grecaptcha) && get(recaptchaEl)))
    return;

  const id = get(grecaptcha)!.render(get(recaptchaEl)!, {
    'sitekey': siteKey,
    'callback': (token: string) => emit('success', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
    'theme': theme,
    'size': size,
  });

  emit('captcha-id', id);
  set(rendered, true);
}

window.onRecaptchaLoaded = renderCaptcha;

onMounted(() => {
  if (!get(grecaptcha)) {
    useHead({
      script: [
        {
          src: `${
            useRecaptchaNet
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
