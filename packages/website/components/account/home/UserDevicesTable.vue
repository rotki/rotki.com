<script setup lang="ts">
import type { DataTableColumn, TablePaginationData } from '@rotki/ui-library';
import type { UserDevice } from '~/types/account';
import { createReusableTemplate } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { formatDate } from '~/utils/date';

const { t } = useI18n({ useScope: 'global' });

const pagination = ref<TablePaginationData>();
const deviceToDelete = ref<UserDevice>();
const deviceToRename = ref<UserDevice>();
const deleteLoading = ref<boolean>(false);
const renameLoading = ref<boolean>(false);

const { loading, userDevices } = useUserDevices();

const headers = computed<DataTableColumn<UserDevice>[]>(() => [{
  label: t('account.devices.headers.label'),
  key: 'label',
  cellClass: 'font-bold',
}, {
  label: t('account.devices.headers.platform'),
  key: 'platform',
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

interface PlatformDisplay {
  icon?: string;
  image?: string;
  label: string;
}

const platformMapping: Record<string, PlatformDisplay> = {
  linux: { image: '/img/linux.svg', label: 'Linux' },
  darwin: { icon: 'lu-os-apple', label: 'macOS' },
  windows: { icon: 'lu-os-windows', label: 'Windows' },
  docker: { image: '/img/docker.svg', label: 'Docker' },
  kubernetes: { image: '/img/kubernetes.svg', label: 'Kubernetes' },
};

function getPlatformDisplay(platform: string): PlatformDisplay {
  return platformMapping[platform.toLowerCase()] || { label: platform };
}

const [DefinePlatformDisplay, ReusablePlatformDisplay] = createReusableTemplate<{ platform: PlatformDisplay }>();

const isLoading = computed<boolean>(() => get(loading) || get(deleteLoading) || get(renameLoading));

function showDeleteDialog(device: UserDevice): void {
  set(deviceToDelete, device);
}

function showRenameDialog(device: UserDevice): void {
  set(deviceToRename, { ...device });
}
</script>

<template>
  <div>
    <DefinePlatformDisplay #default="{ platform }">
      <div class="flex items-center gap-2">
        <RuiIcon
          v-if="platform.icon"
          :name="platform.icon"
          size="20"
        />
        <img
          v-else-if="platform.image"
          :src="platform.image"
          :alt="platform.label"
          class="size-5 filter brightness-0"
        />
        <span>{{ platform.label }}</span>
      </div>
    </DefinePlatformDisplay>
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
      <template #item.platform="{ row }">
        <ReusablePlatformDisplay :platform="getPlatformDisplay(row.platform)" />
      </template>
      <template #item.lastSeenAt="{ row }">
        {{ formatDate(row.lastSeenAt, 'MMMM DD, YYYY - HH:mm:ss') }}
      </template>
      <template #item.actions="{ row }">
        <div class="flex gap-2">
          <RuiButton
            variant="text"
            color="primary"
            :disabled="isLoading"
            @click="showRenameDialog(row)"
          >
            <template #prepend>
              <RuiIcon
                name="lu-pencil"
                size="20"
              />
            </template>
            {{ t('actions.rename') }}
          </RuiButton>
          <RuiButton
            color="error"
            variant="text"
            :disabled="isLoading"
            @click="showDeleteDialog(row)"
          >
            <template #prepend>
              <RuiIcon
                name="lu-trash-2"
                size="20"
              />
            </template>
            {{ t('actions.delete') }}
          </RuiButton>
        </div>
      </template>
    </RuiDataTable>

    <DeleteDeviceDialog
      v-model="deviceToDelete"
      v-model:loading="deleteLoading"
    />

    <RenameDeviceDialog
      v-model="deviceToRename"
      v-model:loading="renameLoading"
    />
  </div>
</template>
