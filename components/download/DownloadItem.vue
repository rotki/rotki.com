<script lang="ts" setup>
export interface DownloadItemProps {
  platform: string;
  url: string;
  icon: 'lu-cloud-download-2-fill' | 'lu-os-apple' | 'lu-os-windows';
}

defineProps<DownloadItemProps>();

const { t } = useI18n();
</script>

<template>
  <div :class="$style.wrapper">
    <div :class="$style.icon">
      <RuiIcon
        :name="icon"
        color="primary"
      />
    </div>
    <div :class="$style.body">
      <div>
        <p :class="$style.for">
          {{ t('download.download_for') }}
        </p>
        <h6 :class="$style.platform">
          {{ platform }}
        </h6>
      </div>
      <div>
        <a
          :href="url"
          download
        >
          <RuiButton
            color="primary"
            size="lg"
          >
            {{ t('download.action') }}
          </RuiButton>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply p-4 lg:p-6 bg-rui-primary/[0.04];
  @apply flex flex-col space-y-4;

  .icon {
    @apply flex items-center justify-center p-3 w-12 h-12 bg-white rounded-[0.625rem] text-rui-primary;
  }

  .body {
    @apply flex items-end md:items-start justify-between md:flex-col space-x-4 md:space-x-0 md:space-y-4;
  }

  .for {
    @apply text-body-1 text-rui-text-secondary;
  }

  .platform {
    @apply text-h6 font-medium;
  }
}
</style>
