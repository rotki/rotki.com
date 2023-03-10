<script lang="ts" setup>
const css = useCssModule();

withDefaults(
  defineProps<{
    theme?: 'light' | 'dark';
    size?: 'compact' | 'normal';
    invalid?: boolean;
  }>(),
  {
    theme: 'light',
    size: 'normal',
  }
);

const emit = defineEmits<{
  (e: 'error'): void;
  (e: 'expired'): void;
  (e: 'success', value: string): void;
  (e: 'captcha-id', value: number): void;
}>();

const {
  public: {
    recaptcha: { siteKey },
  },
} = useRuntimeConfig();

const recaptchaEl = ref<HTMLElement | null>(null);
const rendered = ref(false);

// this will be populated once the deferred captcha script is loaded
const grecaptcha = computed(() => window.grecaptcha);

/**
 * Renders the captcha if not rendered and required fields are available
 */
const renderCaptcha = () => {
  if (rendered.value || !(grecaptcha.value && recaptchaEl.value)) {
    return;
  }

  const id = grecaptcha.value.render(recaptchaEl.value, {
    sitekey: siteKey,
    callback: (token: string) => emit('success', token),
    'expired-callback': () => emit('expired'),
    'error-callback': () => emit('error'),
  });

  emit('captcha-id', id);
  rendered.value = true;
};

onMounted(() => {
  nextTick(renderCaptcha);
});

watch(grecaptcha, renderCaptcha);
</script>

<template>
  <div :class="css.wrapper">
    <div
      ref="recaptchaEl"
      :class="css.recaptcha"
      :data-size="size"
      :data-theme="theme"
    />

    <p v-if="invalid" :class="css.error">
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
  @apply text-xs font-sans text-[#e53935] mt-2;
}
</style>
