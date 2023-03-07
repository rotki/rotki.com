<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    selected: boolean;
    mt?: string;
  }>(),
  {
    mt: '-18px',
  }
);
const { mt } = toRefs(props);
const checkStyle = computed(() => ({
  'margin-top': mt.value,
}));

const css = useCssModule();
</script>
<template>
  <div :class="css.mark">
    <CheckIcon v-if="selected" :class="css.check" :style="checkStyle" />
  </div>
</template>
<style lang="scss" module>
.mark {
  @apply flex flex-row justify-end;

  padding-right: 3px;
  height: 0;
  width: 100%;
}

.check {
  display: inline;
  height: 24px;
  width: 24px;
}
</style>
