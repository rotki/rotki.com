<template>
  <premium-feature>
    <template #title> Graphs and Statistics</template>
    <div>
      Premium users can visit the graphs/statistics page and get graphs for:
    </div>
    <div class="mt-8">
      <div>Networth over time</div>
      <div>Asset amount and total asset value over times</div>
      <div>Breakdown of total net worth per location</div>
      <div>Breakdown of total net worth per asset</div>
    </div>
  </premium-feature>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'GraphsStatistics',
})
</script>
