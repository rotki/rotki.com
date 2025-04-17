<script setup lang="ts">
import type { ApiResponse, SelectedPlan } from '~/types';
import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { DiscountInfo, DiscountType } from '~/types/payment';

const model = defineModel<string>({ required: true });

const discountInfo = defineModel<DiscountInfo | undefined>('discountInfo', { required: true });

const props = defineProps<{
  plan: SelectedPlan;
}>();

const { plan } = toRefs(props);

const value = ref<string>('');
const loading = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });
const { fetchWithCsrf } = useFetchWithCsrf();

async function fetchDiscountInfo(value: string) {
  const selectedPlan = get(plan);
  set(loading, true);
  try {
    const response = await fetchWithCsrf<ApiResponse<boolean>>(
      '/webapi/2/discounts',
      {
        body: {
          discountCode: value,
          durationInMonths: selectedPlan.durationInMonths,
          subscriptionTierId: selectedPlan.subscriptionTierId,
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
  if (info && info.isValid) {
    set(model, get(value));
  }
});

watch(model, (model) => {
  set(value, model);
});

watch([model, discountInfo], async ([model, discountInfo]) => {
  if (model && !discountInfo) {
    await fetchDiscountInfo(model);
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
  <RuiTextField
    v-if="!discountInfo || !discountInfo.isValid"
    v-model="value"
    color="primary"
    variant="outlined"
    :label="t('home.plans.tiers.step_3.discount.label')"
    :error-messages="discountInfo?.error"
    :hint="t('home.plans.tiers.step_3.discount.hint')"
  >
    <template #append>
      <RuiButton
        color="primary"
        :disabled="!value || loading"
        @click="fetchDiscountInfo(value)"
      >
        {{ t('home.plans.tiers.step_3.discount.apply_code') }}
      </RuiButton>
    </template>
  </RuiTextField>
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
