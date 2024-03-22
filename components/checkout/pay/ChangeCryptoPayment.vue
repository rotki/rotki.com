<script setup lang="ts">
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:model-value', value: boolean): void;
  (event: 'change'): void;
}>();

const confirmed = ref(false);

const { t } = useI18n();

function change() {
  emit('change');
  emit('update:model-value', false);
}
</script>

<template>
  <RuiDialog
    :model-value="modelValue"
    size="sm"
    @update:model-value="emit('update:model-value', $event)"
  >
    <template #title>
      {{ t('home.plans.tiers.step_3.change_payment.title') }}
    </template>
    <div class="text-rui-text-secondary">
      {{ t('home.plans.tiers.step_3.change_payment.warning') }}
    </div>

    <div>
      <RuiCheckbox
        v-model="confirmed"
        class="mt-3"
        color="primary"
      >
        <i18n-t
          keypath="home.plans.tiers.step_3.change_payment.switch_agree"
          scope="global"
        >
          <template #separator>
            <br />
          </template>
        </i18n-t>
      </RuiCheckbox>
    </div>

    <template #actions>
      <RuiButton
        color="primary"
        variant="text"
        @click="emit('update:model-value', false)"
      >
        {{ t('actions.cancel') }}
      </RuiButton>
      <RuiButton
        color="error"
        :disabled="!confirmed"
        @click="change()"
      >
        {{ t('home.plans.tiers.step_3.change_payment.title') }}
      </RuiButton>
    </template>
  </RuiDialog>
</template>
