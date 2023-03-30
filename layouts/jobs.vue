<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Jobs </template>
    <div :class="css.container">
      <TextHeading>Available Roles</TextHeading>
      <ul :class="css.tabs">
        <li :class="css.tab">
          <NuxtLink
            :active-class="css.active"
            :class="css.link"
            to="/jobs/backend"
          >
            Python Backend Developer
          </NuxtLink>
        </li>
        <li :class="css.tab">
          <NuxtLink
            :active-class="css.active"
            :class="css.link"
            to="/jobs/frontend"
          >
            Vue.js/TypeScript Developer
          </NuxtLink>
        </li>
      </ul>
      <slot />
    </div>
  </PageContainer>
</template>

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
