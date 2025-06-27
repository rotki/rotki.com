<script setup lang="ts">
import type { ApiResponse, SelectedPlan } from '~/types';
import { get, set } from '@vueuse/core';
import { DiscountInfo, DiscountType } from '~/types/payment';

const model = defineModel<string>({ required: true });

const discountInfo = defineModel<DiscountInfo | undefined>('discountInfo', { required: true });

const props = defineProps<{
  plan: SelectedPlan;
}>();

const { plan } = toRefs(props);
const { t } = useI18n({ useScope: 'global' });

const value = ref<string>('');

const loading = ref(false);

async function fetchDiscountInfo(value: string) {
  const { planId } = get(plan);
  set(loading, true);
  try {
    const response = await fetchWithCsrf<ApiResponse<boolean>>(
      '/webapi/2/discounts',
      {
        body: {
          discountCode: value,
          planId,
        },
        method: 'POST',
      },
    );

    const parsed = DiscountInfo.parse(response);
    set(discountInfo, parsed);
  }
  catch (error: any) {
    const errorData = error.response?._data;
    set(discountInfo, {
      isValid: false,
      error: (errorData && 'error' in errorData) ? errorData.error.toString() : error.message,
    });
  }
  finally {
    set(loading, false);
  }
}

watch(discountInfo, (info) => {
  const internalValue = get(value);
  if (info && info.isValid && internalValue) {
    set(model, internalValue);
  }
});

watch(model, (model) => {
  set(value, model);
});

watchImmediate([model, discountInfo, plan], async ([model, discountInfo]) => {
  if (model && !discountInfo) {
    await fetchDiscountInfo(model);
  }
});

watch(plan, async () => {
  const modelVal = get(model);
  if (modelVal && get(discountInfo)) {
    await fetchDiscountInfo(modelVal);
  }
});

watch(value, () => {
  const info = get(discountInfo);
  if (info && !info.isValid) {
    set(discountInfo, undefined);
  }
});

function reset() {
  set(model, '');
  set(discountInfo, undefined);
}
</script>

<template>
  <form
    v-if="!discountInfo || !discountInfo.isValid"
    @submit.prevent="fetchDiscountInfo(value)"
  >
    <RuiTextField
      v-model="value"
      color="primary"
      variant="outlined"
      :label="t('home.plans.tiers.step_3.discount.label')"
      :error-messages="discountInfo?.error"
      :hint="t('home.plans.tiers.step_3.discount.hint')"
    >
      <template #append>
        <RuiButton
          type="button"
          color="primary"
          :loading="loading"
          :disabled="!value"
          @click="fetchDiscountInfo(value)"
        >
          {{ t('home.plans.tiers.step_3.discount.apply_code') }}
        </RuiButton>
      </template>
    </RuiTextField>
  </form>

  <div
    v-else
    class="rounded-md px-3 h-14 flex items-center justify-between border border-rui-success"
  >
    <div>
      <div class="flex items-center gap-1">
        <div class="text-xs text-rui-text-secondary">
          {{ t('home.plans.tiers.step_3.discount.applied') }}
        </div>
        <div class="text-xs font-bold uppercase">
          {{ model }}
        </div>
      </div>
      <div class="flex gap-1 font-bold text-sm text-rui-primary">
        <div class="text-rui-success">
          {{ t('home.plans.tiers.step_3.discount.you_save', { amount: discountInfo.discountedAmount }) }}
          <template v-if="discountInfo.discountType === DiscountType.PERCENTAGE">
            {{
              t('home.plans.tiers.step_3.discount.percent_off', {
                percentage: discountInfo.discountAmount,
              })
            }}
          </template>
        </div>
      </div>
    </div>
    <RuiButton
      icon
      variant="text"
      @click="reset()"
    >
      <RuiIcon name="lu-x" />
    </RuiButton>
  </div>
</template>
