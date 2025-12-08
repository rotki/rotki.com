<script setup lang="ts">
import { findTierByKey } from '~/composables/rotki-sponsorship/utils';

interface Props {
  selectedTier: string;
  nftImages: Record<string, string>;
  isLoading?: boolean;
  error?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: false,
});

const emit = defineEmits<{
  retry: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const imageLoading = ref<boolean>(true);

const tierLabel = computed<string | undefined>(() => findTierByKey(props.selectedTier)?.label);
</script>

<template>
  <div class="nft-image-container w-full flex justify-center lg:block">
    <div class="aspect-square w-full max-w-md md:max-w-full bg-rui-grey-100 rounded-lg flex items-center justify-center overflow-hidden">
      <div
        v-if="error"
        class="text-rui-error text-center"
      >
        <div class="text-lg font-medium">
          {{ t('sponsor.sponsor_page.nft_image.failed_to_load') }}
        </div>
        <button
          class="mt-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          @click="emit('retry')"
        >
          {{ t('sponsor.sponsor_page.nft_image.retry') }}
        </button>
      </div>
      <div
        v-else-if="nftImages[selectedTier]"
        class="w-full h-full bg-rui-grey-50 relative"
      >
        <img
          :key="nftImages[selectedTier]"
          :src="nftImages[selectedTier]"
          :alt="t('sponsor.sponsor_page.nft_image.alt', { tier: tierLabel })"
          class="w-full h-full object-cover rounded-lg z-[2]"
          width="448"
          height="448"
          @loadstart="imageLoading = true"
          @load="imageLoading = false"
          @error="imageLoading = false"
        />
        <RuiSkeletonLoader
          v-if="imageLoading"
          class="absolute top-0 left-0 z-[0] w-full h-full"
        />
      </div>
      <RuiSkeletonLoader
        v-else-if="isLoading"
        class="w-full h-full"
      />
      <div
        v-else
        class="text-rui-text-secondary text-center"
      >
        <div class="text-4xl mb-2">
          🎨
        </div>
        <div class="text-lg font-medium">
          {{ t('sponsor.sponsor_page.nft_image.not_available', { tier: tierLabel }) }}
        </div>
        <div class="text-sm text-rui-text-secondary mt-1">
          {{ t('sponsor.sponsor_page.nft_image.image_not_available') }}
        </div>
      </div>
    </div>
  </div>
</template>
