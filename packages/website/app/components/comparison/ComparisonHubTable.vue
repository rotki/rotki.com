<script setup lang="ts">
import type { ComparisonsCollectionItem } from '@nuxt/content';

defineProps<{
  items: ComparisonsCollectionItem[];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <table class="w-full border-collapse text-left">
    <thead>
      <tr class="border-b border-rui-grey-200 bg-rui-primary/[.04]">
        <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
          {{ t('compare.hub.col_tool') }}
        </th>
        <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
          {{ t('compare.hub.col_storage') }}
        </th>
        <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
          {{ t('compare.hub.col_open_source') }}
        </th>
        <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
          {{ t('compare.hub.col_custody') }}
        </th>
        <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
          {{ t('compare.hub.col_deployment') }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-rui-grey-100 bg-rui-primary/[.07]">
        <th
          scope="row"
          class="p-4 text-body-1 font-bold text-rui-primary border-l-4 border-rui-primary"
        >
          rotki
        </th>
        <td class="p-4 text-body-2 font-medium text-rui-text">
          {{ t('compare.hub.rotki_storage') }}
        </td>
        <td class="p-4 text-body-2 font-medium text-rui-text">
          <span class="inline-flex items-center gap-2">
            <RuiIcon
              name="lu-circle-check"
              size="18"
              color="success"
              class="shrink-0"
            />
            {{ t('compare.hub.rotki_open_source') }}
          </span>
        </td>
        <td class="p-4 text-body-2 font-medium text-rui-text">
          <span class="inline-flex items-center gap-2">
            <RuiIcon
              name="lu-circle-check"
              size="18"
              color="success"
              class="shrink-0"
            />
            {{ t('compare.hub.rotki_custody') }}
          </span>
        </td>
        <td class="p-4 text-body-2 font-medium text-rui-text">
          {{ t('compare.hub.rotki_deployment') }}
        </td>
      </tr>
      <tr
        v-for="item in items"
        :key="item.path"
        class="border-b border-rui-grey-100 last:border-b-0"
      >
        <th
          scope="row"
          class="p-4 text-body-2 font-medium border-l-4 border-transparent"
        >
          <NuxtLink
            :to="item.path"
            class="text-rui-text hover:text-rui-primary"
          >
            {{ item.competitor }}
          </NuxtLink>
        </th>
        <td class="p-4 text-body-2 text-rui-text-secondary">
          {{ t('compare.hub.competitor_storage') }}
        </td>
        <td class="p-4 text-body-2 text-rui-text-secondary">
          <span class="inline-flex items-center gap-2">
            <RuiIcon
              name="lu-circle-x"
              size="18"
              color="error"
              class="shrink-0 opacity-70"
            />
            {{ t('compare.hub.competitor_open_source') }}
          </span>
        </td>
        <td class="p-4 text-body-2 text-rui-text-secondary">
          <span class="inline-flex items-center gap-2">
            <RuiIcon
              name="lu-circle-x"
              size="18"
              color="error"
              class="shrink-0 opacity-70"
            />
            {{ t('compare.hub.competitor_custody') }}
          </span>
        </td>
        <td class="p-4 text-body-2 text-rui-text-secondary">
          {{ t('compare.hub.competitor_deployment') }}
        </td>
      </tr>
    </tbody>
  </table>
</template>
