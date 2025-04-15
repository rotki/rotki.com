<script lang="ts" setup>
defineProps<{
  selected: boolean;
}>();
</script>

<template>
  <RuiRadio
    :model-value="selected"
    :value="true"
    color="primary"
    hide-details
  />
</template>
