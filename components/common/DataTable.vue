<template>
  <CardContainer>
    <TextHeading :class="css.heading" subheading>
      <slot name="title" />
    </TextHeading>
    <div :class="css.tableWrapper">
      <table :class="css.table">
        <thead :class="css.thead">
          <tr>
            <th
              v-for="header in headers"
              :key="header.text"
              :class="{
                [header.className]: true,
                [css.header]: true,
              }"
              scope="col"
            >
              {{ header.text }}
            </th>
          </tr>
        </thead>
        <tbody :class="css.tbody">
          <tr v-for="(item, index) in visibleItems" :key="index">
            <slot :item="item" name="item" />
          </tr>
        </tbody>
      </table>
    </div>
    <PaginationControl v-model="page" :pages="pages" />
  </CardContainer>
</template>

<script setup lang="ts">
import { DataTableHeader } from '~/types/common'

const props = defineProps<{
  headers: DataTableHeader[]
  items: unknown[]
}>()

const { items } = toRefs(props)
const itemsPerPage = 5
const page = ref(1)
const pages = computed(() => Math.ceil(items.value.length / itemsPerPage))
const visibleItems = computed(() => {
  const start = (page.value - 1) * itemsPerPage
  return items.value.slice(start, start + itemsPerPage)
})

const css = useCssModule()
</script>

<style lang="scss" module>
@import '@/assets/css/media.scss';

.table {
  @apply min-w-full divide-y divide-gray-200 text-left;
}

.header {
  @apply px-6 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider;
}

.heading {
  @apply font-serif text-shade11 mb-4;
}

.tableWrapper {
  @apply overflow-hidden border border-gray-200 sm:rounded-lg;
}

.thead {
  @apply bg-gray-50;
}

.tbody {
  @apply bg-white divide-y divide-gray-200;
}
</style>
