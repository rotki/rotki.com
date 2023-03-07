<script setup lang="ts">
const props = defineProps<{
  modelValue: number;
  pages: number;
}>();

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>();

const { modelValue, pages } = toRefs(props);
const isFirstPage = computed(() => modelValue.value === 1);
const isLastPage = computed(() => modelValue.value === pages.value);
const gotoPage = (page: number) => {
  emit('update:modelValue', page);
};

const css = useCssModule();
</script>

<template>
  <div :class="css.pagination">
    <IconButton :disabled="isFirstPage" @click="gotoPage(1)">
      <ChevronDoubleLeft />
    </IconButton>
    <IconButton :disabled="isFirstPage" @click="gotoPage(modelValue - 1)">
      <ChevronLeft />
    </IconButton>
    <span :class="css.page">Page {{ modelValue }} of {{ pages }}</span>
    <IconButton :disabled="isLastPage" @click="gotoPage(modelValue + 1)">
      <ChevronRight />
    </IconButton>
    <IconButton :disabled="isLastPage" @click="gotoPage(pages)">
      <ChevronDoubleRight />
    </IconButton>
  </div>
</template>

<style lang="scss" module>
@import '~/assets/css/media.scss';

.pagination {
  @apply flex flex-row justify-end p-2 pt-3 items-center;
}

.page {
  @apply text-sm px-2;
}
</style>
