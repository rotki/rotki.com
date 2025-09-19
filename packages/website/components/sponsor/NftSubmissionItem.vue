<script setup lang="ts">
import type { NftSubmission } from '~/types/sponsor';
import { get } from '@vueuse/shared';
import { useSponsorshipData } from '~/composables/rotki-sponsorship';
import { formatDate } from '~/utils/date';

defineProps<{
  submission: NftSubmission;
}>();

defineEmits<{
  'edit-submission': [submission: NftSubmission];
}>();

const { t } = useI18n({ useScope: 'global' });

const { data: sponsorshipData } = await useSponsorshipData();
const currentReleaseName = computed(() => get(sponsorshipData)?.releaseName);
</script>

<template>
  <div class="border border-rui-grey-300 dark:border-rui-grey-700 rounded-lg p-3">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <NftSubmissionItemChips :submission="submission" />
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
          v-if="currentReleaseName === submission.releaseVersion"
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
        <RuiTooltip
          v-else
        >
          <template #activator>
            <RuiButton
              variant="outlined"
              size="sm"
              disabled
            >
              <template #prepend>
                <RuiIcon
                  name="lu-pencil"
                  size="16"
                />
              </template>
              {{ t('actions.edit') }}
            </RuiButton>
          </template>
          {{ t('sponsor.submit_name.error.cannot_edit_previous_release') }}
        </RuiTooltip>
      </div>
    </div>
  </div>
</template>
