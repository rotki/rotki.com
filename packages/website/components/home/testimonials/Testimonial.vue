<script setup lang="ts">
import type { TestimonialsLocalCollectionItem, TestimonialsRemoteCollectionItem } from '@nuxt/content';

type TestimonialBody = TestimonialsLocalCollectionItem['body'] | TestimonialsRemoteCollectionItem['body'];

interface TestimonialProps {
  avatar?: string;
  body: TestimonialBody;
  username: string;
  url?: string;
}

withDefaults(defineProps<TestimonialProps>(), { avatar: undefined, url: undefined });
</script>

<template>
  <div :class="$style.content">
    <span :class="$style.thumbnails">
      <span :class="$style.icon">
        <RuiIcon
          name="lu-message-circle"
          size="16"
        />
      </span>
      <span
        v-if="avatar"
        :class="$style.avatar"
      >
        <a
          v-if="url"
          :href="url"
          target="_blank"
        >
          <NuxtImg
            :src="avatar"
            :alt="username"
            width="32"
            height="32"
            format="webp"
            loading="lazy"
            class="object-cover"
          />
        </a>
        <NuxtImg
          v-else
          :src="avatar"
          :alt="username"
          width="32"
          height="32"
          format="webp"
          loading="lazy"
          class="object-cover"
        />
      </span>
    </span>
    <ContentRenderer :value="body">
      <ContentRenderer
        :class="$style.text"
        :value="body"
        tag="span"
      />
    </ContentRenderer>
    <a
      v-if="url"
      :href="url"
      :class="$style.username"
      target="_blank"
    >
      {{ username }}
    </a>
    <span
      v-else
      :class="$style.username"
    >
      {{ username }}
    </span>
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
    @apply text-rui-text font-medium text-lg min-h-[8rem] text-justify;

    p {
      @apply mb-0;
    }
  }

  .username {
    @apply text-body-1 text-sm text-rui-text-secondary;
  }
}
</style>
