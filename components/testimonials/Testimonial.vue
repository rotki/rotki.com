<script setup lang="ts">
import { type TestimonialMarkdownContent } from '~/composables/markdown';

withDefaults(
  defineProps<{
    avatar?: string;
    body: TestimonialMarkdownContent['body'];
    username: string;
    url: string;
  }>(),
  { avatar: undefined },
);
const css = useCssModule();
</script>

<template>
  <div :class="css.content">
    <span :class="css.thumbnails">
      <span :class="css.icon">
        <RuiIcon name="chat-1-line" size="16" />
      </span>
      <span v-if="avatar" :class="css.avatar">
        <a v-if="url" :href="url" target="_blank">
          <img :src="avatar" :alt="username" class="object-cover" />
        </a>
        <img v-else :src="avatar" :alt="username" class="object-cover" />
      </span>
    </span>
    <ContentRenderer :value="body">
      <ContentRendererMarkdown :class="css.text" :value="body" tag="span" />
    </ContentRenderer>
    <a v-if="url" :href="url" :class="css.username" target="_blank">
      {{ username }}
    </a>
    <span v-else :class="css.username">{{ username }}</span>
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex flex-col gap-6;

  .thumbnails {
    @apply flex gap-2;

    .icon {
      @apply p-2 bg-rui-primary rounded-lg text-white;
    }

    .avatar {
      @apply rounded-full w-8 h-8 overflow-hidden flex items-center justify-center;
    }
  }

  .text {
    @apply text-rui-text font-medium text-lg;

    p {
      @apply mb-0;
    }
  }

  .username {
    @apply text-body-1 text-sm text-rui-text-secondary;
  }
}
</style>
