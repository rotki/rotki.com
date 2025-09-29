<script setup lang="ts">
import { set } from '@vueuse/core';

const modelValue = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  change: [];
}>();

const confirmed = ref(false);

const { t } = useI18n({ useScope: 'global' });

function change() {
  emit('change');
  set(modelValue, false);
}
</script>

<template>
  <RuiDialog
    v-model="modelValue"
    max-width="500"
  >
    <RuiCard content-class="!pt-0">
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
          @click="modelValue = false"
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
