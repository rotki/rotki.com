<script setup lang="ts">
const { t } = useI18n();

const year = new Date().getFullYear().toString();
</script>

<template>
  <div class="py-8 lg:py-16">
    <div class="container">
      <div class="space-y-4 lg:space-y-8">
        <div class="flex flex-col lg:flex-row justify-between items-center">
          <div class="hidden lg:block">
            <RuiLogo text />
          </div>
          <NuxtLink v-if="false" to="/download">
            <RuiButton color="primary" variant="text" size="lg">
              {{ t('page_footer.download') }}
            </RuiButton>
          </NuxtLink>
        </div>
        <div class="flex flex-col xl:flex-row justify-between items-center">
          <div class="hidden lg:block">
            <NavigationMenu />
          </div>
          <FooterLegalese />
        </div>
      </div>
      <div class="border-t border-grey-100 my-6 lg:my-10" />
      <div
        class="flex flex-col-reverse lg:flex-row justify-between items-center"
      >
        <div
          class="flex flex-wrap justify-center space-x-1 text-rui-text-secondary mt-2 lg:mt-0"
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
