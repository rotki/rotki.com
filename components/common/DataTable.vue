<template>
  <card>
    <heading :class="$style.heading" subheading>
      <slot name="title" />
    </heading>
    <div :class="$style.tableWrapper">
      <table :class="$style.table">
        <thead :class="$style.thead">
          <tr>
            <th
              v-for="header in headers"
              :key="header.text"
              :class="{
                [header.className]: true,
                [$style.header]: true,
              }"
              scope="col"
            >
              {{ header.text }}
            </th>
          </tr>
        </thead>
        <tbody :class="$style.tbody">
          <tr v-for="(item, index) in visibleItems" :key="index">
            <slot :item="item" name="item" />
          </tr>
        </tbody>
      </table>
    </div>
    <pagination v-model="page" :pages="pages" />
  </card>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import Pagination from '~/components/common/Pagination.vue'

export type DataTableHeader = {
  readonly text: string
  readonly value: string
  readonly className?: string
  readonly sortable?: boolean
}

export default defineComponent({
  name: 'DataTable',
  components: { Pagination },
  props: {
    headers: {
      required: true,
      type: Array as PropType<DataTableHeader[]>,
    },
    items: {
      required: true,
      type: Array,
    },
  },
  setup(props) {
    const { items } = toRefs(props)
    const itemsPerPage = 5
    const page = ref(1)
    const pages = computed(() => Math.ceil(items.value.length / itemsPerPage))
    const visibleItems = computed(() => {
      const start = (page.value - 1) * itemsPerPage
      return items.value.slice(start, start + itemsPerPage)
    })

    return {
      visibleItems,
      page,
      pages,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

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
