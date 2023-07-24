<script lang="ts" setup>
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-wrap justify-center space-x-2">
    <ExternalLink
      size="lg"
      same-tab
      :text="t('footer_legalese.impressum')"
      url="/impressum"
    />
    <ExternalLink
      size="lg"
      same-tab
      :text="t('footer_legalese.privacy_policy')"
      url="/privacy-policy"
    />
    <ExternalLink
      size="lg"
      same-tab
      :text="t('footer_legalese.tos')"
      url="/tos"
    />
    <ExternalLink
      size="lg"
      no-ref
      :text="t('footer_legalese.faq')"
      url="https://rotki.readthedocs.io/en/latest/faq.html"
    />
  </div>
</template>
