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
        <div class="flex justify-between items-center">
          <div>
            <AppLogo
              text
              class="!h-8 md:h-12"
            />
          </div>
          <NuxtLink to="/download">
            <RuiButton
              color="primary"
              variant="text"
              size="lg"
            >
              {{ t('page_footer.download') }}
            </RuiButton>
          </NuxtLink>
        </div>
        <div
          class="flex md:flex-col xl:flex-row justify-between items-start md:items-center"
        >
          <NavigationMenu
            class="grow xl:grow-0 flex-col md:flex-row gap-y-3 !gap-x-4"
          />
          <FooterLegalese
            class="grow xl:grow-0 mt-0 md:mt-4 xl:mt-0 flex-col md:flex-row gap-y-3"
          />
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
