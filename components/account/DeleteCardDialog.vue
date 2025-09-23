<script lang="ts" setup>
import type { SavedCard } from '~/types';
import { set } from '@vueuse/core';
import { usePaymentCardsStore } from '~/store/payments/cards';
import { useLogger } from '~/utils/use-logger';

interface Props {
  card: SavedCard | null;
}

const showDialog = defineModel<boolean>({ required: true });

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:deleting': [value: boolean];
  'success': [];
  'error': [error: { title: string; message: string }];
}>();

const { t } = useI18n({ useScope: 'global' });
const logger = useLogger('delete-card-dialog');

const { deleteCard } = usePaymentCardsStore();

const deleting = ref<boolean>(false);

async function handleDeleteCard() {
  if (!props.card) {
    return;
  }

  try {
    set(deleting, true);
    emit('update:deleting', true);
    set(showDialog, false);
    await deleteCard(props.card.token);
    emit('success');
  }
  catch (error: any) {
    logger.error('Failed to delete card:', error);
    emit('error', {
      title: t('common.error'),
      message: error.message || t('common.error_occurred'),
    });
  }
  finally {
    set(deleting, false);
    emit('update:deleting', false);
  }
}

function handleCancel() {
  set(showDialog, false);
}
</script>

<template>
  <RuiDialog
    v-model="showDialog"
    max-width="500"
  >
    <RuiCard content-class="!pt-0">
      <template #header>
        {{ t('home.plans.tiers.step_3.saved_card.delete.title') }}
      </template>

      {{ t('home.plans.tiers.step_3.saved_card.delete.description') }}

      <div
        v-if="card"
        class="mt-4 p-3 bg-rui-grey-50 rounded-md flex items-center gap-3"
      >
        <div class="rounded bg-white h-8 w-12 flex items-center justify-center">
          <img
            :src="card.imageUrl"
            :alt="t('common.card')"
            class="w-full h-full object-contain object-center"
          />
        </div>
        <div>
          <div class="font-medium text-sm">
            •••• •••• •••• {{ card.last4 }}
          </div>
          <div class="text-xs text-rui-text-secondary">
            {{ t('home.plans.tiers.step_3.saved_card.expiry', { expiresAt: card.expiresAt }) }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="w-full flex justify-end gap-3">
          <RuiButton
            variant="text"
            :disabled="deleting"
            @click="handleCancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            color="error"
            :loading="deleting"
            @click="handleDeleteCard()"
          >
            {{ t('actions.delete') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>
