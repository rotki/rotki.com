<script setup lang="ts">
import { toTitleCase } from '~/utils/text';

interface TierContent {
  benefits: string;
  example: string[];
}

const { selectedTier, tierContent, releaseName } = defineProps<{
  selectedTier: string;
  tierContent: Record<string, TierContent>;
  releaseName?: string;
}>();

const { t } = useI18n({ useScope: 'global' });

const showExampleSponsors = ref<boolean>(false);

const currentTierContent = computed<TierContent | undefined>(() => tierContent[selectedTier]);
</script>

<template>
  <div class="rounded-xl border border-rui-grey-200 bg-rui-grey-50 p-5">
    <h2 class="text-subtitle-1 font-medium text-rui-text mb-2">
      {{ t('sponsor.sponsor_page.benefits.title') }}
    </h2>
    <div
      v-if="currentTierContent"
      class="text-body-2 text-rui-text-secondary"
    >
      <p v-if="releaseName">
        {{ t('sponsor.sponsor_page.benefits.tier_sponsorship', { tier: toTitleCase(selectedTier), releaseName }) }}
      </p>
      <!-- The tier cards list every tier's perks; this repeats the selected one as a confirmation -->
      <p class="flex items-start gap-2 mt-2 text-rui-text">
        <RuiIcon
          name="lu-check"
          size="18"
          class="text-rui-success mt-0.5 shrink-0"
        />
        <span>{{ currentTierContent.benefits }}</span>
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
          class="!p-0 font-medium"
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
          <img
            v-for="(imageUrl, index) in currentTierContent.example"
            :key="index"
            :src="imageUrl"
            :alt="`Sponsor example ${index + 1}`"
            class="w-full h-auto rounded-lg border border-rui-grey-200 object-cover"
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
