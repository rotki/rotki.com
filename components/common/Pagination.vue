<template>
  <div :class="$style.pagination">
    <icon-button :disabled="isFirstPage" @click="gotoPage(1)">
      <chevron-double-left />
    </icon-button>
    <icon-button :disabled="isFirstPage" @click="gotoPage(value - 1)">
      <chevron-left />
    </icon-button>
    <span :class="$style.page">Page {{ value }} of {{ pages }}</span>
    <icon-button :disabled="isLastPage" @click="gotoPage(value + 1)">
      <chevron-right />
    </icon-button>
    <icon-button :disabled="isLastPage" @click="gotoPage(pages)">
      <chevron-double-right />
    </icon-button>
  </div>
</template>
<script lang="ts">
import { computed, defineComponent, toRefs } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Pagination',
  props: {
    value: {
      type: Number,
      required: true,
    },
    pages: {
      type: Number,
      required: true,
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const { value, pages } = toRefs(props)
    const isFirstPage = computed(() => value.value === 1)
    const isLastPage = computed(() => value.value === pages.value)
    const gotoPage = (page: number) => {
      emit('input', page)
    }
    return {
      gotoPage,
      isFirstPage,
      isLastPage,
    }
  },
})
</script>
<style lang="scss" module>
@import '~assets/css/media';

.pagination {
  @apply flex flex-row justify-end p-2 pt-3 items-center;
}

.page {
  @apply text-sm px-2;
}
</style>
