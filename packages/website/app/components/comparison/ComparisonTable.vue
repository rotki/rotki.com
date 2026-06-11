<script setup lang="ts">
export interface ComparisonRow {
  label: string;
  rotki: string;
  competitor: string;
  highlight?: boolean;
}

const { competitor, rows } = defineProps<{
  competitor: string;
  rows: ComparisonRow[];
}>();
</script>

<template>
  <div class="overflow-x-auto border border-rui-grey-200 rounded-xl bg-white shadow-sm">
    <table class="w-full border-collapse text-left">
      <thead>
        <tr class="border-b border-rui-grey-200">
          <th class="p-4 text-body-2 font-bold text-rui-text-secondary w-1/3">
            &nbsp;
          </th>
          <th class="p-4 text-body-1 font-bold text-rui-primary bg-rui-primary/10 border-x border-rui-primary/20">
            rotki
          </th>
          <th class="p-4 text-body-1 font-medium text-rui-text-secondary">
            {{ competitor }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.label"
          class="border-b border-rui-grey-100 last:border-b-0"
        >
          <th
            scope="row"
            class="p-4 align-top text-body-2 font-medium text-rui-text-secondary border-l-4"
            :class="row.highlight ? 'border-rui-primary' : 'border-transparent'"
          >
            {{ row.label }}
          </th>
          <td
            class="p-4 align-top text-body-2 border-x border-rui-primary/20"
            :class="row.highlight ? 'bg-rui-primary/[.07]' : 'bg-rui-primary/[.03]'"
          >
            <div class="flex items-start gap-2">
              <RuiIcon
                v-if="row.highlight"
                name="lu-circle-check"
                size="18"
                color="success"
                class="shrink-0 mt-0.5"
              />
              <span :class="row.highlight ? 'font-medium text-rui-text' : 'text-rui-text'">{{ row.rotki }}</span>
            </div>
          </td>
          <td class="p-4 align-top text-body-2 text-rui-text-secondary">
            {{ row.competitor }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
