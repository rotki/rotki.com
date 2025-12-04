<script lang="ts" setup>
import ButtonLink from '~/components/common/ButtonLink.vue';
import PageFooter from '~/components/footer/PageFooter.vue';
import Default from '~/layouts/default.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <Default>
    <div class="bg-rui-primary/[.04] py-10 lg:py-20">
      <div class="container">
        <div class="max-w-[768px]">
          <div class="mb-3 text-h6 -ml-1">
            <ButtonLink
              to="/jobs"
              color="primary"
              inline
            >
              {{ t('jobs.title') }}
            </ButtonLink>
          </div>
          <div class="text-h4">
            <slot name="title" />
          </div>
          <div
            v-if="$slots.description"
            class="mt-5 body-1"
          >
            <slot name="description" />
          </div>
        </div>
      </div>
    </div>
    <slot />
    <template #footer>
      <PageFooter landing />
    </template>
  </Default>
</template>
