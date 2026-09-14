<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { findTierByKey } from '~/modules/web3/sponsorship/utils';

interface Props {
  selectedTier: string;
  nftImages: Record<string, string>;
  isLoading?: boolean;
  error?: boolean;
}

interface TierTint {
  panel: string;
  chip: string;
  icon: string;
}

const { selectedTier, nftImages, isLoading = false, error = false } = defineProps<Props>();

const emit = defineEmits<{
  retry: [];
}>();

// Tier colors echo the tier badges in the sponsorship artwork. Chip colors keep white text at AA contrast.
// Icon colors are solid: a translucent currentColor darkens where the icon's strokes overlap.
const TIER_TINTS: Record<string, TierTint> = {
  bronze: {
    chip: 'bg-[#9a5420] text-white',
    icon: 'text-[#b8773f] ring-[#9a5420]/15',
    panel: 'bg-gradient-to-br from-[#fbf0e4] to-[#efd2b3]',
  },
  gold: {
    chip: 'bg-[#8f6a0e] text-white',
    icon: 'text-[#b08a26] ring-[#8f6a0e]/15',
    panel: 'bg-gradient-to-br from-[#fdf8e4] to-[#f2df9e]',
  },
  silver: {
    chip: 'bg-[#5f6b7a] text-white',
    icon: 'text-[#7d8896] ring-[#5f6b7a]/15',
    panel: 'bg-gradient-to-br from-[#f5f7f9] to-[#dce1e8]',
  },
};

const DEFAULT_TINT: TierTint = {
  chip: 'bg-rui-primary text-white',
  icon: 'text-rui-text-disabled ring-rui-grey-300',
  panel: 'bg-rui-grey-100',
};

const { t } = useI18n({ useScope: 'global' });

const imageLoading = ref<boolean>(true);
const imageFailed = ref<boolean>(false);
// Bumped on retry so the <img> remounts and the browser requests the image again
const imageAttempt = ref<number>(0);

const tierLabel = computed<string | undefined>(() => findTierByKey(selectedTier)?.label);

const tint = computed<TierTint>(() => TIER_TINTS[selectedTier] ?? DEFAULT_TINT);

const imageUrl = computed<string>(() => nftImages[selectedTier] ?? '');

const showImage = computed<boolean>(() => !!get(imageUrl) && !get(imageFailed));

const showSkeleton = computed<boolean>(() => !get(showImage) && (isLoading || Object.keys(nftImages).length === 0));

const unavailableTitle = computed<string>(() => (get(imageFailed)
  ? t('sponsor.sponsor_page.nft_image.artwork_load_failed_title')
  : t('sponsor.sponsor_page.nft_image.artwork_unavailable_title')));

const unavailableMessage = computed<string>(() => (get(imageFailed)
  ? t('sponsor.sponsor_page.nft_image.artwork_load_failed', { tier: get(tierLabel) })
  : t('sponsor.sponsor_page.nft_image.artwork_unavailable', { tier: get(tierLabel) })));

function onImageLoad(): void {
  set(imageLoading, false);
}

function onImageError(): void {
  set(imageLoading, false);
  set(imageFailed, true);
}

function retryImage(): void {
  // Without a URL there is nothing to reload locally: refetch the tier data instead
  if (!get(imageUrl)) {
    emit('retry');
    return;
  }
  set(imageFailed, false);
  set(imageLoading, true);
  set(imageAttempt, get(imageAttempt) + 1);
}

watch(imageUrl, () => {
  set(imageFailed, false);
  set(imageLoading, true);
  set(imageAttempt, 0);
});
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
        <RuiButton
          class="mt-2 mx-auto"
          color="primary"
          @click="emit('retry')"
        >
          {{ t('sponsor.sponsor_page.nft_image.retry') }}
        </RuiButton>
      </div>
      <RuiSkeletonLoader
        v-else-if="showSkeleton"
        data-id="nft-image-skeleton"
        class="w-full h-full"
      />
      <div
        v-else-if="showImage"
        class="w-full h-full bg-rui-grey-50 relative"
      >
        <img
          :key="`${imageUrl}#${imageAttempt}`"
          data-id="nft-image"
          :src="imageUrl"
          :alt="t('sponsor.sponsor_page.nft_image.alt', { tier: tierLabel })"
          class="w-full h-full object-cover rounded-lg z-[2]"
          width="448"
          height="448"
          fetchpriority="high"
          @load="onImageLoad()"
          @error="onImageError()"
        />
        <RuiSkeletonLoader
          v-if="imageLoading"
          class="absolute top-0 left-0 z-[0] w-full h-full"
        />
      </div>
      <div
        v-else
        data-id="nft-image-unavailable"
        role="status"
        class="relative w-full h-full flex flex-col items-center justify-center px-8 text-center"
        :class="tint.panel"
      >
        <span
          v-if="tierLabel"
          data-id="nft-image-tier"
          class="absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm"
          :class="tint.chip"
        >
          {{ tierLabel }}
        </span>
        <div
          class="flex items-center justify-center size-16 rounded-full bg-white/70 ring-1"
          :class="tint.icon"
        >
          <RuiIcon
            name="lu-image-off"
            size="28"
          />
        </div>
        <!-- Not a heading: the panel renders before the page's h1, so a heading would break heading order -->
        <p
          data-id="nft-image-title"
          class="mt-5 text-lg font-semibold text-rui-text"
        >
          {{ unavailableTitle }}
        </p>
        <p
          data-id="nft-image-message"
          class="mt-1.5 max-w-[18rem] text-sm leading-relaxed text-rui-text-secondary text-balance"
        >
          {{ unavailableMessage }}
        </p>
        <RuiButton
          data-id="nft-image-retry"
          class="mt-6"
          color="primary"
          size="sm"
          variant="outlined"
          @click="retryImage()"
        >
          <template #prepend>
            <RuiIcon
              name="lu-refresh-cw"
              size="14"
            />
          </template>
          {{ t('sponsor.sponsor_page.nft_image.try_again') }}
        </RuiButton>
      </div>
    </div>
  </div>
</template>
