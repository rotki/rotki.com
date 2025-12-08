<script setup lang="ts">
import type { UserDevice } from '~/types/account';
import { get, set } from '@vueuse/shared';
import { useUserDevices } from '~/composables/account/use-user-devices';
import { logger } from '~/utils/use-logger';

const modelValue = defineModel<UserDevice | undefined>({ required: true });
const loading = defineModel<boolean>('loading', { required: true });

const { t } = useI18n({ useScope: 'global' });

const newLabel = ref<string>('');

const { renameDevice: renameDeviceCaller } = useUserDevices();

watch(modelValue, (device) => {
  set(newLabel, device?.label ?? '');
});

async function renameDevice(): Promise<void> {
  const device = get(modelValue);
  const label = get(newLabel).trim();

  if (!device || !label)
    return;

  set(loading, true);
  try {
    await renameDeviceCaller(device.id, label);
    set(modelValue, undefined);
  }
  catch (error) {
    logger.error('Failed to rename device:', error);
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
    <RuiCard>
      <template #header>
        {{ t('account.devices.rename.title') }}
      </template>
      <RuiTextField
        v-model="newLabel"
        :label="t('account.devices.rename.label')"
        variant="outlined"
        color="primary"
        :disabled="loading"
      />
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
          color="primary"
          :loading="loading"
          :disabled="!newLabel.trim()"
          @click="renameDevice()"
        >
          {{ t('actions.save') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
