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
  <div class="flex flex-col gap-6">
    <span class="flex gap-2">
      <span class="p-2 bg-rui-primary rounded-lg text-white">
        <RuiIcon
          name="lu-message-circle"
          size="16"
        />
      </span>
      <span
        v-if="avatar"
        class="rounded-full w-8 h-8 overflow-hidden flex items-center justify-center"
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
        class="text-rui-text font-medium text-lg min-h-[8rem] text-justify [&_p]:mb-0"
        :value="body"
        tag="span"
      />
    </ContentRenderer>
    <a
      v-if="url"
      :href="url"
      class="text-body-1 text-sm text-rui-text-secondary"
      target="_blank"
    >
      {{ username }}
    </a>
    <span
      v-else
      class="text-body-1 text-sm text-rui-text-secondary"
    >
      {{ username }}
    </span>
  </div>
</template>
