<template>
  <div class="flex flex-row mt-37">
    <div class="flex-col col-span-full md:col-span-5 md:col-end-5">
      <div class="flex flex-row feature-header">
        <div class="flex-col">
          <slot name="title"></slot>
        </div>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>
