<script setup lang="ts">
export interface DownloadSponsor {
  name: string;
  image: string;
  gold?: boolean;
  tooltip?: string;
}

defineProps<{
  sponsor: DownloadSponsor;
}>();
</script>

<template>
  <div class="flex flex-col gap-3">
    <img
      class="size-12 min-w-12 rounded-md overflow-hidden mx-auto !object-cover"
      :class="{ 'size-20 min-w-20': sponsor.gold }"
      :src="sponsor.image"
      :alt="sponsor.name"
      :width="sponsor.gold ? 80 : 48"
      :height="sponsor.gold ? 80 : 48"
      loading="lazy"
    />
    <div class="flex flex-col items-center justify-between relative w-[12rem] max-w-full mx-auto">
      <img
        v-if="sponsor.gold"
        src="/img/ribbon.png"
        alt="Gold sponsor ribbon"
        width="192"
        height="42"
        fit="cover"
        loading="lazy"
        class="w-full h-[125%] absolute top-0 left-0"
      />
      <RuiTooltip
        :disabled="!sponsor.tooltip"
        :popper="{ placement: 'bottom' }"
      >
        <template #activator>
          <div
            class="text-sm font-bold text-left text-rui-text-secondary relative"
            :class="{ 'text-yellow-900 max-w-[80%] px-0.5 text-center leading-8 whitespace-nowrap': sponsor.gold }"
          >
            {{ sponsor.name }}
          </div>
        </template>
        {{ sponsor.tooltip }}
      </RuiTooltip>
    </div>
  </div>
</template>
