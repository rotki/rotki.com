<script setup lang="ts">
import type { DataTableColumn, TablePaginationData } from '@rotki/ui-library';
import type { UserDevice } from '~/types/account';
import { useConfirmDialog } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { formatDate } from '~/utils/date';

const { t } = useI18n({ useScope: 'global' });

const deleteLoading = ref<boolean>(false);
const deviceToDelete = ref<UserDevice>();
const pagination = ref<TablePaginationData>();

const { deleteDevice: deleteDeviceCaller, loading, userDevices } = useUserDevices();

const headers = computed<DataTableColumn<UserDevice>[]>(() => [{
  label: t('account.devices.headers.label'),
  key: 'label',
  cellClass: 'font-bold',
}, {
  label: t('account.devices.headers.last_seen'),
  key: 'lastSeenAt',
}, {
  label: t('common.actions'),
  key: 'actions',
  align: 'end',
  class: 'capitalize',
  cellClass: 'flex justify-end',
}]);

const {
  isRevealed: confirmDialog,
  reveal: showConfirmDialog,
  confirm: confirmDelete,
  cancel: cancelDelete,
} = useConfirmDialog();

async function showDeleteConfirmation(device: UserDevice): Promise<void> {
  set(deviceToDelete, device);
  const { isCanceled } = await showConfirmDialog();

  if (isCanceled) {
    set(deviceToDelete, undefined);
    return;
  }

  await deleteDevice();
}

async function deleteDevice(): Promise<void> {
  const device = get(deviceToDelete);
  if (!device)
    return;

  set(deleteLoading, true);
  try {
    await deleteDeviceCaller(device.id);
    set(deviceToDelete, undefined);
  }
  catch (error) {
    logger.error('Failed to delete device:', error);
  }
  finally {
    set(deleteLoading, false);
  }
}
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account.tabs.devices') }}
    </div>
    <RuiDataTable
      v-model:pagination="pagination"
      :cols="headers"
      :loading="loading"
      :empty="{ description: t('account.devices.no_devices_found') }"
      :rows="userDevices"
      :outlined="true"
      row-attr="id"
    >
      <template #item.lastSeenAt="{ row }">
        {{ formatDate(row.lastSeenAt, 'MMMM DD, YYYY - HH:mm:ss') }}
      </template>
      <template #item.actions="{ row }">
        <RuiButton
          color="error"
          :disabled="loading || deleteLoading"
          @click="showDeleteConfirmation(row)"
        >
          <template #prepend>
            <RuiIcon
              name="lu-trash-2"
              size="20"
            />
          </template>
          {{ t('actions.delete') }}
        </RuiButton>
      </template>
    </RuiDataTable>

    <RuiDialog
      v-model="confirmDialog"
      max-width="500"
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
        >
          <template #label>
            <strong>{{ deviceToDelete?.label }}</strong>
          </template>
        </i18n-t>
        <div class="flex justify-end gap-4 pt-4">
          <RuiButton
            variant="text"
            color="primary"
            @click="cancelDelete()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            color="error"
            :loading="deleteLoading"
            @click="confirmDelete()"
          >
            {{ t('actions.delete') }}
          </RuiButton>
        </div>
      </RuiCard>
    </RuiDialog>
  </div>
</template>
