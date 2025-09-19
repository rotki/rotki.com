<script lang="ts" setup>
defineProps<{
  selected: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <RuiRadio
    :model-value="selected"
    :value="true"
    :disabled="disabled"
    color="primary"
    hide-details
  />
</template>
