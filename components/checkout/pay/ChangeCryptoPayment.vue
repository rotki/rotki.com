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
    max-width="500"
    @update:model-value="emit('update:model-value', $event)"
  >
    <RuiCard>
      <template #header>
        {{ t('home.plans.tiers.step_3.change_payment.title') }}
      </template>
      <template #subheader>
        {{ t('home.plans.tiers.step_3.change_payment.warning') }}
      </template>

      <div>
        <RuiCheckbox
          v-model="confirmed"
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

      <div class="flex justify-end gap-4 pt-4">
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
      </div>
    </RuiCard>
  </RuiDialog>
</template>
