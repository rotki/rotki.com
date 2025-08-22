<script setup lang="ts">
import type { NftSubmission } from '~/types/sponsor';
import { formatDate } from '~/utils/date';

defineProps<{
  submission: NftSubmission;
  nftMetadata?: {
    tier?: string;
    releaseName?: string;
  };
}>();

defineEmits<{
  'edit-submission': [submission: NftSubmission];
}>();

const { t } = useI18n();
</script>

<template>
  <div class="border border-rui-grey-300 dark:border-rui-grey-700 rounded-lg p-3">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-2">
          <RuiChip
            variant="outlined"
            size="sm"
          >
            NFT #{{ submission.nftId }}
          </RuiChip>
          <RuiChip
            v-if="nftMetadata?.tier"
            size="sm"
            variant="outlined"
            :class="getTierClasses(nftMetadata?.tier)"
          >
            <span class="mr-1">
              {{ getTierMedal(nftMetadata.tier) }}
            </span>
            <span class="uppercase font-medium mr-1">{{ t('sponsor.submit_name.tier_info', { tier: nftMetadata.tier }) }}</span>
            <span v-if="nftMetadata?.releaseName">
              <i18n-t keypath="sponsor.submit_name.tier_in_release">
                <template #release>
                  <span class="font-medium">{{ nftMetadata.releaseName }}</span>
                </template>
              </i18n-t>
            </span>
          </RuiChip>
        </div>
        <img
          v-if="submission.imageUrl"
          :src="submission.imageUrl"
          alt="Submission image"
          class="size-12 rounded object-cover mt-3 mb-2"
        />
        <div
          v-if="submission.displayName"
          class="text-sm font-medium"
        >
          {{ submission.displayName }}
        </div>
        <div
          v-if="submission.email"
          class="text-sm text-rui-text-secondary"
        >
          {{ submission.email }}
        </div>
        <div class="text-xs text-rui-text-disabled mt-1">
          {{ formatDate(submission.updatedAt) }}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <RuiButton
          variant="outlined"
          size="sm"
          color="primary"
          @click="$emit('edit-submission', submission)"
        >
          <template #prepend>
            <RuiIcon
              name="lu-pencil"
              size="16"
            />
          </template>
          {{ t('actions.edit') }}
        </RuiButton>
      </div>
    </div>
  </div>
</template>
