<script setup lang="ts">
import type { DownloadItemSingle } from '~/types/download';
import ButtonLink from '~/components/common/ButtonLink.vue';

defineProps<{
  item: DownloadItemSingle;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <ButtonLink
    :to="item.url"
    rounded
    color="primary"
    variant="default"
    size="lg"
    data-cy="main-download-button"
    @click="emit('click')"
  >
    <template #prepend>
      <RuiIcon
        v-if="item.icon"
        :name="item.icon"
        size="20"
      />
      <img
        v-else-if="item.image"
        :src="item.image"
        :alt="item.platform"
        width="20"
        height="20"
        loading="lazy"
        class="brightness-0 invert"
      />
    </template>
    {{ t('download.download_for', { platform: item.platform }) }}
  </ButtonLink>
</template>
