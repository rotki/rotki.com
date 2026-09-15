<script setup lang="ts">
export interface PageTabItem {
  icon: string;
  label: string;
  to: string;
  /** Opens the route with a full page load, for routes served with their own CSP. */
  reload?: boolean;
}

const modelValue = defineModel<string>();

defineProps<{
  tabs: PageTabItem[];
}>();
</script>

<template>
  <div class="hidden lg:block w-[270px] shrink-0">
    <RuiTabs
      v-model="modelValue"
      vertical
      align="start"
      color="primary"
    >
      <RuiTab
        v-for="tab in tabs"
        :key="tab.to"
        link
        :to="tab.to"
        :target="tab.reload ? '_top' : undefined"
      >
        <template #prepend>
          <RuiIcon :name="tab.icon" />
        </template>
        {{ tab.label }}
      </RuiTab>
    </RuiTabs>
  </div>
  <div class="lg:hidden">
    <RuiTabs
      v-model="modelValue"
      grow
      color="primary"
    >
      <RuiTab
        v-for="tab in tabs"
        :key="tab.to"
        link
        :to="tab.to"
        :target="tab.reload ? '_top' : undefined"
      >
        <template #prepend>
          <RuiIcon
            class="shrink-0"
            :name="tab.icon"
          />
        </template>
        {{ tab.label }}
      </RuiTab>
    </RuiTabs>
  </div>
</template>
