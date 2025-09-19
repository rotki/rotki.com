<script setup lang="ts">
defineProps<{ modelValue: boolean; disabled?: boolean }>();

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiCheckbox
    id="refund"
    :disabled="disabled"
    :model-value="modelValue"
    color="primary"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <i18n-t
      keypath="policies.refund.accept_policy.text"
      scope="global"
      tag="span"
    >
      <template #action>
        <ButtonLink
          to="/refund-policy"
          color="primary"
          tag="span"
          :class="$style.link"
          external
          target="_blank"
        >
          {{ t('policies.refund.accept_policy.action') }}
        </ButtonLink>
      </template>
    </i18n-t>
  </RuiCheckbox>
</template>

<style module lang="scss">
.link {
  @apply p-0 #{!important};

  display: unset;

  :global(> span) {
    display: unset !important;
  }
}
</style>
