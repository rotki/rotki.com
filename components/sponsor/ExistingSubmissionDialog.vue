<script setup lang="ts">
import type { NftSubmission } from '~/types/sponsor';
import NftSubmissionItem from '~/components/sponsor/NftSubmissionItem.vue';

const isOpen = defineModel<boolean>({ required: true });

defineProps<{
  submission: NftSubmission | null;
}>();

const emit = defineEmits<{
  edit: [];
  cancel: [];
}>();

const { t } = useI18n();

function handleEdit(): void {
  isOpen.value = false;
  emit('edit');
}

function handleCancel(): void {
  isOpen.value = false;
  emit('cancel');
}
</script>

<template>
  <RuiDialog
    v-if="submission"
    v-model="isOpen"
    :title="t('sponsor.existing_submission.title')"
    max-width="500"
  >
    <template #default>
      <RuiCard content-class="!pt-0">
        <template #header>
          {{ t('sponsor.existing_submission.message', { nftId: submission.nftId }) }}
        </template>
        <div class="space-y-4">
          <p class="text-body-2 text-muted">
            {{ t('sponsor.existing_submission.question') }}
          </p>

          <NftSubmissionItem
            :submission="submission"
            @edit-submission="handleEdit()"
          />
        </div>
        <template #footer>
          <div class="flex w-full justify-end gap-2">
            <RuiButton
              variant="text"
              color="primary"
              @click="handleCancel()"
            >
              {{ t('sponsor.existing_submission.cancel_button') }}
            </RuiButton>
          </div>
        </template>
      </RuiCard>
    </template>
  </RuiDialog>
</template>
