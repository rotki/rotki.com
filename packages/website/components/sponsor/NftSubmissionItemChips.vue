<script setup lang="ts">
import type { SponsorshipTier } from '~/composables/rotki-sponsorship/types';
import type { NftSubmission } from '~/types/sponsor';
import { get } from '@vueuse/shared';
import { findTierById } from '~/composables/rotki-sponsorship/utils';
import { getTierClasses, getTierMedal } from '~/utils/nft-tiers';

const props = defineProps<{
  submission: NftSubmission;
}>();

const { t } = useI18n({ useScope: 'global' });

const tier = computed<SponsorshipTier | undefined>(() => {
  const tierId = props.submission.tierId;
  if (!isDefined(tierId))
    return undefined;
  return findTierById(tierId);
});

const tierKey = computed<string | undefined>(() => get(tier)?.key);
const tierLabel = computed<string | undefined>(() => get(tier)?.label);
</script>

<template>
  <div class="flex items-center gap-2 mb-2">
    <RuiChip
      variant="outlined"
      size="sm"
    >
      NFT #{{ submission.nftId }}
    </RuiChip>
    <RuiChip
      v-if="isDefined(submission.tierId)"
      size="sm"
      variant="outlined"
      :class="getTierClasses(tierKey)"
    >
      <span class="mr-1">
        {{ getTierMedal(tierKey) }}
      </span>
      <span class="uppercase font-medium mr-1">{{ t('sponsor.submit_name.tier_info', { tier: tierLabel }) }}</span>
      <span v-if="submission.releaseVersion">
        <i18n-t keypath="sponsor.submit_name.tier_in_release">
          <template #release>
            <span class="font-medium">{{ submission.releaseVersion }}</span>
          </template>
        </i18n-t>
      </span>
    </RuiChip>
  </div>
</template>
