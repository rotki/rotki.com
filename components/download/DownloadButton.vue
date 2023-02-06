<template>
  <ActionButton primary :text="t('actions.download')" @click="emit('click')" />
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'click'): void }>()

const { t } = useI18n()
</script>
