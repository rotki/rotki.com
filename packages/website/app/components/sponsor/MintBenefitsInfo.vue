<script setup lang="ts">
import { toTitleCase } from '~/utils/text';

interface TierContent {
  benefits: string;
  example: string[];
}

interface Props {
  selectedTier: string;
  tierContent: Record<string, TierContent>;
  releaseName?: string;
}

const props = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const showExampleSponsors = ref<boolean>(false);

const currentTierContent = computed<TierContent | undefined>(() => props.tierContent[props.selectedTier]);
</script>

<template>
  <div class="bg-rui-grey-100 p-4 rounded-lg">
    <h6 class="font-bold mb-2">
      {{ t('sponsor.sponsor_page.benefits.title') }}
    </h6>
    <div
      v-if="currentTierContent"
      class="text-sm text-rui-text-secondary"
    >
      <p>
        {{ t('sponsor.sponsor_page.benefits.tier_sponsorship', { tier: toTitleCase(selectedTier), releaseName }) }}
      </p>
      <p class="font-medium mt-1">
        {{ t('sponsor.sponsor_page.benefits.benefits_label', { benefits: currentTierContent.benefits }) }}
      </p>

      <!-- Example Sponsor Images -->
      <div
        v-if="currentTierContent.example && currentTierContent.example.length > 0"
        class="mt-4"
      >
        <RuiButton
          variant="text"
          size="sm"
          color="primary"
          class="!p-0 font-medium text-rui-text hover:text-rui-primary"
          @click="showExampleSponsors = !showExampleSponsors"
        >
          <template #append>
            <RuiIcon
              :name="showExampleSponsors ? 'lu-chevron-down' : 'lu-chevron-right'"
              size="16"
            />
          </template>
          {{ t('sponsor.sponsor_page.benefits.see_examples') }}
        </RuiButton>
        <div
          v-if="showExampleSponsors"
          class="flex flex-wrap gap-2 mt-2"
        >
          <NuxtImg
            v-for="(imageUrl, index) in currentTierContent.example"
            :key="index"
            :src="imageUrl"
            :alt="`Sponsor example ${index + 1}`"
            class="w-full h-auto rounded-md object-cover"
            sizes="100vw md:800px"
            loading="lazy"
          />
        </div>
      </div>
    </div>
    <div
      v-else
      class="space-y-2"
    >
      <RuiSkeletonLoader />
      <RuiSkeletonLoader />
      <RuiSkeletonLoader />
    </div>
  </div>
</template>
