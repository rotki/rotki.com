<script setup lang="ts">
import type { TestimonialsCollectionItem } from '@nuxt/content';

type TestimonialBody = TestimonialsCollectionItem['body'];

interface TestimonialProps {
  avatar?: string;
  body: TestimonialBody;
  username: string;
  url?: string;
}

defineProps<TestimonialProps>();
</script>

<template>
  <figure class="flex flex-col gap-6 md:h-full rounded-xl border border-rui-grey-200 bg-white p-6 md:p-8">
    <RuiIcon
      name="lu-quote"
      size="28"
      class="text-rui-primary/40"
    />
    <blockquote class="grow">
      <ContentRenderer
        class="text-rui-text text-body-1 md:text-lg [&_p]:mb-0"
        :value="body"
        tag="div"
      />
    </blockquote>
    <figcaption class="flex items-center gap-3 pt-4 border-t border-rui-grey-100">
      <img
        v-if="avatar"
        :src="avatar"
        :alt="username"
        width="40"
        height="40"
        loading="lazy"
        class="size-10 rounded-full object-cover"
      />
      <span
        v-else
        class="flex items-center justify-center size-10 rounded-full bg-rui-primary/[0.08] text-rui-primary font-medium"
        aria-hidden="true"
      >
        {{ username.replace(/^@/, '').charAt(0).toUpperCase() }}
      </span>
      <a
        v-if="url"
        :href="url"
        class="text-body-2 font-medium text-rui-text hover:text-rui-primary"
        target="_blank"
        rel="noopener nofollow"
      >
        {{ username }}
      </a>
      <span
        v-else
        class="text-body-2 font-medium text-rui-text"
      >
        {{ username }}
      </span>
    </figcaption>
  </figure>
</template>
