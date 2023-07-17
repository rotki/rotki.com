<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    url: string;
    text?: string;
    sameTab?: boolean;
    noRef?: boolean;
  }>(),
  {
    text: '',
    sameTab: false,
    noRef: false,
  },
);

const { text, url } = toRefs(props);
const display = computed(() => (text.value ? text.value : url.value));
const css = useCssModule();
</script>

<template>
  <NuxtLink
    :class="css.link"
    :href="url"
    :target="sameTab ? '_self' : '_blank'"
    :rel="noRef ? 'noreferrer' : null"
  >
    <slot>
      {{ display }}
    </slot>
  </NuxtLink>
</template>

<style module>
.link {
  @apply hover:text-shade8 text-primary;
}
</style>
