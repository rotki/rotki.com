<script lang="ts" setup>
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div :class="$style.wrapper">
    <div
      :class="$style.wrapper__container"
      class="container"
    >
      <h6 :class="$style.title">
        {{ t('download.documentation.title') }}
      </h6>
      <h4 :class="$style.heading">
        {{ t('download.documentation.heading') }}
      </h4>
      <div :class="$style.desc__wrapper">
        <p :class="$style.description">
          {{ t('download.documentation.description') }}
        </p>

        <div class="shrink-0">
          <ButtonLink
            color="primary"
            variant="default"
            size="lg"
            external
            to="https://docs.rotki.com"
          >
            {{ t('download.documentation.action') }}
            <template #append>
              <RuiIcon name="lu-external-link" />
            </template>
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply py-10 lg:py-20 bg-rui-primary/[0.04];

  &__container {
    @apply flex flex-col;

    .title {
      @apply text-rui-light-primary text-h6 mb-3 font-medium;
    }

    .heading {
      @apply text-rui-text text-h4 mb-5;
    }

    .desc__wrapper {
      @apply flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 items-start justify-between;

      .description {
        @apply text-rui-text text-body-1 max-w-[48rem];
      }
    }
  }
}
</style>
