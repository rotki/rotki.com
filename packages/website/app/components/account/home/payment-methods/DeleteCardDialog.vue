<script lang="ts" setup>
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import SavedCardRow from '@rotki/checkout-ui/components/SavedCardRow.vue';
import { set } from '@vueuse/shared';
import { usePaymentCards } from '~/modules/checkout/composables/use-payment-cards';
import { paymentFailureMessage } from '~/modules/checkout/utils/payment-failure';

const showDialog = defineModel<boolean>({ required: true });
const deleting = defineModel<boolean>('deleting', { default: false });

const { card } = defineProps<{
  card: SavedCard | undefined;
}>();
const emit = defineEmits<{
  success: [];
  error: [error: { title: string; message: string }];
}>();

const { t } = useI18n({ useScope: 'global' });

const { deleteCard } = usePaymentCards();

async function handleDeleteCard(): Promise<void> {
  if (!card) {
    return;
  }

  set(deleting, true);
  set(showDialog, false);
  const deleted = await deleteCard(card.token);
  set(deleting, false);

  if (deleted.ok) {
    emit('success');
    return;
  }

  emit('error', {
    title: t('common.error'),
    message: paymentFailureMessage(deleted.error),
  });
}

function handleCancel(): void {
  set(showDialog, false);
}
</script>

<template>
  <RuiDialog
    v-model="showDialog"
    max-width="500"
  >
    <RuiCard :class-names="{ content: 'pt-0!' }">
      <template #header>
        {{ t('home.plans.tiers.step_3.saved_card.delete.title') }}
      </template>

      {{ t('home.plans.tiers.step_3.saved_card.delete.description') }}

      <div
        v-if="card"
        class="mt-4 p-3 bg-rui-grey-50 rounded-md flex items-center gap-3"
      >
        <SavedCardRow :card="card" />
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
