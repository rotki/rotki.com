<template>
  <page>
    <template #title> Jobs </template>
    <heading>Available Roles</heading>
    <ul :class="$style.tabs">
      <li :class="$style.tab">
        <nuxt-link
          to="/jobs/backend"
          :class="$style.link"
          :active-class="$style.active"
        >
          Python Backend Developer
        </nuxt-link>
      </li>
      <li :class="$style.tab">
        <nuxt-link
          to="/jobs/frontend"
          :class="$style.link"
          :active-class="$style.active"
        >
          Vue.js/TypeScript Developer
        </nuxt-link>
      </li>
    </ul>
    <NuxtChild />
  </page>
</template>

<script>
export default {
  name: 'JobsContent',
}
</script>

<style module lang="scss">
.tabs {
  @apply flex mb-0 list-none flex-wrap pt-6 pb-6 flex-row;
}

.tab {
  @apply -mb-px mr-2 flex-auto text-center font-sans;

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
