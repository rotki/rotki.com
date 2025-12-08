<script setup lang="ts">
import type { UserDevice } from '~/types/account';
import { get, set } from '@vueuse/shared';
import { useUserDevices } from '~/composables/account/use-user-devices';
import { logger } from '~/utils/use-logger';

const modelValue = defineModel<UserDevice | undefined>({ required: true });
const loading = defineModel<boolean>('loading', { required: true });

const { t } = useI18n({ useScope: 'global' });

const { deleteDevice: deleteDeviceCaller } = useUserDevices();

async function deleteDevice(): Promise<void> {
  const device = get(modelValue);
  if (!device)
    return;

  set(loading, true);
  try {
    await deleteDeviceCaller(device.id);
    set(modelValue, undefined);
  }
  catch (error) {
    logger.error('Failed to delete device:', error);
  }
  finally {
    set(loading, false);
  }
}

function close(): void {
  set(modelValue, undefined);
}
</script>

<template>
  <RuiDialog
    :model-value="!!modelValue"
    max-width="500"
    @closed="close()"
  >
    <RuiCard
      content-class="!pt-0"
    >
      <template #header>
        {{ t('account.devices.delete.title') }}
      </template>
      <i18n-t
        tag="div"
        keypath="account.devices.delete.description"
        scope="global"
      >
        <template #label>
          <strong>{{ modelValue?.label }}</strong>
        </template>
      </i18n-t>
      <div class="flex justify-end gap-4 pt-4">
        <RuiButton
          variant="text"
          color="primary"
          :disabled="loading"
          @click="close()"
        >
          {{ t('actions.cancel') }}
        </RuiButton>
        <RuiButton
          color="error"
          :loading="loading"
          @click="deleteDevice()"
        >
          {{ t('actions.delete') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
