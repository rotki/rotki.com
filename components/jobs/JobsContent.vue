<template>
  <page>
    <template #title> Jobs </template>
    <div :class="$style.container">
      <heading>Available Roles</heading>
      <ul :class="$style.tabs">
        <li :class="$style.tab">
          <nuxt-link
            :active-class="$style.active"
            :class="$style.link"
            to="/jobs/backend"
          >
            Python Backend Developer
          </nuxt-link>
        </li>
        <li :class="$style.tab">
          <nuxt-link
            :active-class="$style.active"
            :class="$style.link"
            to="/jobs/frontend"
          >
            Vue.js/TypeScript Developer
          </nuxt-link>
        </li>
      </ul>
      <NuxtChild />
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'JobsContent',
})
</script>

<style lang="scss" module>
.container {
  @apply py-16;
}

.tabs {
  @apply flex mb-0 list-none flex-wrap pt-6 pb-6 flex-row;
}

.tab {
  @apply -mb-px mr-2 flex-1 text-center font-sans;

  &:last-child {
    @apply mr-0;
  }
}

.link {
  @apply text-xs font-bold uppercase px-5 py-3 border-primary border rounded block leading-normal text-primary;
}

.active {
  @apply text-white bg-primary;
}
</style>
