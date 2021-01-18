<template>
  <feature>
    <template #title> Dashboard 360 degree overview of your holding </template>
    <div class="flex flex-row feature-details">
      <div class="flex flex-col">
        <div class="flex flex-row feature-subtitle">Assets and Liabilities</div>
        <div class="flex flex-row feature-description">
          View all of the assets and liabilities you own, how much of each and
          the total % the asset consists of your net worth.
        </div>
      </div>
    </div>
    <div class="flex flex-row">
      <div class="flex flex-col feature-details">
        <div class="flex flex-row feature-subtitle">Networth fairing</div>
        <div class="flex flex-row feature-description">
          View all of the assets and liabilities you own, how much of each and
          the total % the asset consists of your net worth. Users can also see a
          graph of how their total networth is faring over time. Free users are
          limited to the last 2 weeks.
        </div>
      </div>
    </div>
    <div class="flex flex-row">
      <action-button text="Start now for free" primary></action-button>
    </div>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>
