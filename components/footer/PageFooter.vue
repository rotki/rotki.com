<script setup lang="ts">
withDefaults(
  defineProps<{
    landing?: boolean;
  }>(),
  {
    landing: false,
  },
);

const { t } = useI18n();

const year = new Date().getFullYear().toString();
</script>

<template>
  <div>
    <div class="container">
      <div
        v-if="landing"
        class="space-y-8 pt-8 lg:pt-16 mb-10"
      >
        <div class="flex flex-wrap gap-12">
          <AppLogo
            text
            size="2"
          />
          <div class="flex-1 min-w-full xl:min-w-0 flex justify-center order-2 xl:order-1">
            <FooterNavigation class="w-full xl:max-w-[800px]" />
          </div>
          <div
            class="order-1 xl:order-2 flex justify-end"
          >
            <ButtonLink
              color="primary"
              size="lg"
              to="/download"
              rounded
              variant="filled"
            >
              {{ t('page_footer.download') }}
            </ButtonLink>
          </div>
        </div>
      </div>
      <div class="border-t border-rui-grey-100" />
      <div
        class="flex flex-col-reverse lg:flex-row justify-between items-start md:items-center pt-8 pb-12"
      >
        <div
          class="flex flex-wrap space-x-1 text-rui-text-secondary mt-6 lg:mt-0"
        >
          <div>&copy; Rotki Solutions GmbH 2018-{{ year }}.</div>
          <div>All Rights Reserved.</div>
        </div>
        <div>
          <FooterIconLinks />
        </div>
      </div>
    </div>
  </div>
</template>
