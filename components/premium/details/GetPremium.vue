<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <PremiumFeature>
    <div class="mt-20 flex justify-center flex-col">
      <ButtonLink
        to="/products"
        variant="default"
        size="lg"
        class="text-rui-primary !py-4 !px-10 !text-xl uppercase"
        rounded
      >
        {{ t('actions.get_premium') }}
      </ButtonLink>
    </div>
  </PremiumFeature>
</template>
