<script lang="ts" setup>
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-wrap justify-center gap-x-4">
    <ButtonLink size="lg" to="/impressum" highlight-active>
      {{ t('footer_legalese.impressum') }}
    </ButtonLink>
    <ButtonLink size="lg" to="/privacy-policy" highlight-active>
      {{ t('footer_legalese.privacy_policy') }}
    </ButtonLink>
    <ButtonLink size="lg" to="/tos" highlight-active>
      {{ t('footer_legalese.tos') }}
    </ButtonLink>
    <ButtonLink
      size="lg"
      to="https://rotki.readthedocs.io/en/latest/faq.html"
      external
    >
      {{ t('footer_legalese.faq') }}
    </ButtonLink>
  </div>
</template>
