<script lang="ts" setup>
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-wrap justify-center space-x-2">
    <ButtonLink size="lg" to="/impressum">
      {{ t('footer_legalese.impressum') }}
    </ButtonLink>
    <ButtonLink size="lg" to="/privacy-policy">
      {{ t('footer_legalese.privacy_policy') }}
    </ButtonLink>
    <ButtonLink size="lg" to="/tos">{{ t('footer_legalese.tos') }}</ButtonLink>
    <ButtonLink
      size="lg"
      to="https://rotki.readthedocs.io/en/latest/faq.html"
      external
    >
      {{ t('footer_legalese.faq') }}
    </ButtonLink>
  </div>
</template>
