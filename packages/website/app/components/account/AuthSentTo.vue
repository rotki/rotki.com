<script setup lang="ts">
import { get, set } from '@vueuse/shared';

/**
 * "We sent a link to <address>. Open it to ..." with the address on its own line. The form before
 * this page passes the address in history state, never the URL. The three lines render the same with
 * or without it, so nothing moves when it is read after mount (needed on prerendered pages).
 */
const { sentTo, fallback, openLink } = defineProps<{
  sentTo: string;
  /** Names the address generically when history state does not carry it. */
  fallback: string;
  openLink: string;
}>();

const email = ref<string>();

const recipient = computed<string>(() => get(email) ?? fallback);

onMounted(() => {
  const address: unknown = window.history.state?.email;
  if (typeof address === 'string' && address)
    set(email, address);
});
</script>

<template>
  <p>{{ sentTo }}</p>
  <p
    class="my-1 font-medium text-rui-text [overflow-wrap:anywhere]"
    data-testid="sent-to"
  >
    {{ recipient }}
  </p>
  <p>{{ openLink }}</p>
</template>
