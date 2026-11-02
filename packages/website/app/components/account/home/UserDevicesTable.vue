<script setup lang="ts">
import type { DataTableColumn, TablePaginationData } from '@rotki/ui-library';
import type { UserDevice } from '~/types/account';
import { createReusableTemplate } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import AccountSection from '~/components/account/home/AccountSection.vue';
import DeleteDeviceDialog from '~/components/account/home/DeleteDeviceDialog.vue';
import RenameDeviceDialog from '~/components/account/home/RenameDeviceDialog.vue';
import TimeAgo from '~/components/common/TimeAgo.vue';
import { useUserDevices } from '~/composables/account/use-user-devices';
import { fitsOnePage, SINGLE_LINE_ROWS } from '~/utils/table';

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
  cellClass: 'font-medium',
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
  <AccountSection
    :title="t('account.devices.title')"
    :description="t('account.devices.description')"
  >
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
          width="20"
          height="20"
        />
        <span>{{ platform.label }}</span>
      </div>
    </DefinePlatformDisplay>
    <RuiDataTable
      v-model:pagination="pagination"
      :class="SINGLE_LINE_ROWS"
      :cols="headers"
      :loading="loading"
      :empty="{ label: t('account.devices.no_devices_found'), description: t('account.devices.no_devices_hint') }"
      :rows="userDevices"
      :hide-pagination="fitsOnePage(userDevices)"
      outlined
      row-attr="id"
    >
      <template #item.platform="{ row }">
        <ReusablePlatformDisplay :platform="getPlatformDisplay(row.platform)" />
      </template>
      <template #item.label="{ row }">
        <span
          class="block max-w-80 truncate"
          :title="row.label"
        >
          {{ row.label }}
        </span>
      </template>
      <template #item.lastSeenAt="{ row }">
        <TimeAgo :date="row.lastSeenAt" />
      </template>
      <template #item.actions="{ row }">
        <div class="flex justify-end gap-1">
          <RuiTooltip :open-delay="300">
            <template #activator>
              <RuiButton
                variant="text"
                icon
                size="sm"
                :aria-label="t('account.devices.rename_device', { label: row.label })"
                :disabled="isLoading"
                @click="showRenameDialog(row)"
              >
                <RuiIcon
                  name="lu-pencil"
                  size="16"
                />
              </RuiButton>
            </template>
            {{ t('actions.rename') }}
          </RuiTooltip>
          <RuiTooltip :open-delay="300">
            <template #activator>
              <RuiButton
                variant="text"
                icon
                size="sm"
                color="error"
                :aria-label="t('account.devices.delete_device', { label: row.label })"
                :disabled="isLoading"
                @click="showDeleteDialog(row)"
              >
                <RuiIcon
                  name="lu-trash-2"
                  size="16"
                />
              </RuiButton>
            </template>
            {{ t('actions.delete') }}
          </RuiTooltip>
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
  </AccountSection>
</template>
