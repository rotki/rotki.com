<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <section class="container pt-16 md:pt-24 pb-4 md:pb-8">
    <div class="relative overflow-hidden rounded-2xl bg-rui-primary px-6 py-12 md:px-16 md:py-16 text-center text-white">
      <div
        class="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -bottom-32 -left-20 size-72 rounded-full bg-white/5"
        aria-hidden="true"
      />
      <div class="relative flex flex-col items-center gap-5">
        <h2 class="text-h4 md:text-h3 !font-bold max-w-[720px] text-balance">
          {{ t('download_cta.title') }}
        </h2>
        <p class="text-body-1 md:text-h6 !font-normal text-white/80 max-w-[600px] text-balance">
          {{ t('download_cta.detail') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-3 mt-2">
          <ButtonLink
            to="/download"
            size="lg"
            rounded
            variant="default"
            class="!bg-white !text-rui-primary"
          >
            <template #prepend>
              <RuiIcon
                size="20"
                name="lu-download"
              />
            </template>
            {{ t('actions.download_for_free') }}
          </ButtonLink>
          <ButtonLink
            to="https://docs.rotki.com"
            external
            size="lg"
            rounded
            variant="outlined"
            class="!text-white !border-white/60"
          >
            {{ t('download_cta.docs') }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </section>
</template>
