<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

// `linkHome` renders the call to action as a real anchor instead of a
// click-handler button, so it still works on the statically served 404 body
// where no JavaScript runs (see app/pages/not-found.vue).
const { linkHome = false } = defineProps<{ statusCode: number; linkHome?: boolean }>();

const emit = defineEmits<{ 'handle-error': [] }>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div
    class="w-full flex flex-1 flex-col-reverse lg:flex-row gap-8 lg:gap-20 items-center justify-center lg:justify-between text-center lg:text-left px-2 lg:px-4 py-4"
  >
    <div class="flex flex-col gap-4">
      <h6 class="text-h6 text-rui-primary">
        {{ statusCode }}
      </h6>

      <h3 class="text-h3 font-bold text-rui-text">
        {{ t('not_found.title') }}
      </h3>

      <p class="text-black/60 text-body-1 py-2 mb-0">
        {{ t('not_found.description.line_one') }} <br />
        {{ t('not_found.description.line_two') }}
      </p>

      <ButtonLink
        v-if="linkHome"
        class="self-center lg:self-start"
        to="/"
        variant="default"
        size="lg"
        filled
        color="primary"
      >
        {{ t('actions.go_back_home') }}
      </ButtonLink>
      <RuiButton
        v-else
        class="self-center lg:self-start"
        variant="default"
        size="lg"
        filled
        color="primary"
        @click="emit('handle-error')"
      >
        {{ t('actions.go_back_home') }}
      </RuiButton>
    </div>

    <img
      class="w-1/3 lg:w-1/2 max-w-[40rem]"
      alt="rotki maintenance"
      src="/img/not-found.svg"
      width="640"
      height="480"
      loading="lazy"
    />
  </div>
</template>
