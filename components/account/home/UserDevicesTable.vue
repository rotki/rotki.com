<script setup lang="ts">
import type { DataTableColumn, TablePaginationData } from '@rotki/ui-library';
import type { UserDevice } from '~/types/account';
import { set } from '@vueuse/core';
import { formatDate } from '~/utils/date';

const { t } = useI18n({ useScope: 'global' });

const headers: DataTableColumn<UserDevice>[] = [
  {
    label: t('account.devices.headers.label'),
    key: 'label',
    cellClass: 'font-bold',
  },
  {
    label: t('account.devices.headers.date'),
    key: 'createdAt',
  },
  {
    label: t('common.actions'),
    key: 'actions',
    align: 'end',
    class: 'capitalize',
    cellClass: 'flex justify-end',
  },
];
const deleteLoading = ref(false);
const loading = ref(false);

const { userDevices, fetchDevices, deleteDevice: deleteDeviceCaller } = useUserDevices();

const pagination = ref<TablePaginationData>();

async function refresh() {
  set(loading, true);
  await fetchDevices();
  set(loading, false);
}

onBeforeMount(refresh);

async function deleteDevice(id: number) {
  set(deleteLoading, true);
  await deleteDeviceCaller(id);
  set(deleteLoading, false);
  await refresh();
}
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account.devices.title') }}
    </div>
    <RuiDataTable
      v-model:pagination="pagination"
      :cols="headers"
      :loading="loading"
      :empty="{ description: t('account.devices.no_devices_found') }"
      :rows="userDevices"
      outlined
      row-attr="id"
    >
      <template #item.createdAt="{ row }">
        {{ formatDate(row.createdAt, 'MMMM DD, YYYY - HH:mm:ss') }}
      </template>
      <template #item.actions="{ row }">
        <RuiButton
          color="error"
          :loading="deleteLoading"
          :disabled="loading"
          @click="deleteDevice(row.id)"
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
  </div>
</template>
