<script lang="ts" setup>
import { useMarkdownContent } from '~/composables/markdown';

const css = useCssModule();
const { openJobs, loadJobs } = useMarkdownContent();

await loadJobs();
</script>

<template>
  <PageContainer>
    <template #title> Jobs </template>
    <div :class="css.container">
      <TextHeading>Available Roles</TextHeading>
      <ul v-if="openJobs.length > 0" :class="css.tabs">
        <li v-for="tab in openJobs" :key="tab._id" :class="css.tab">
          <NuxtLink :active-class="css.active" :class="css.link" :to="tab.link">
            {{ tab.title }}
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
