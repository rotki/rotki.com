<script setup lang="ts">
import { get, set, toRefs } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { type ComputedRef } from 'vue';
import { useMainStore } from '~/store';
import { getPlanName } from '~/utils/plans';
import { type Plan } from '~/types';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    vat?: number;
    crypto?: boolean;
    warning?: boolean;
  }>(),
  {
    crypto: false,
    warning: false,
    vat: undefined,
  },
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'select', months: number): void;
}>();
const { t } = useI18n();
const store = useMainStore();
const { plans } = storeToRefs(store);
const { crypto, visible, warning } = toRefs(props);
const confirmed = ref(false);

const availablePlans: ComputedRef<Plan[]> = computed(() => get(plans) ?? []);

const cancel = () => emit('cancel');
const select = (months: number) => {
  if (get(warning) && !get(confirmed)) {
    return;
  }
  return emit('select', months);
};

const getPrice = (plan: Plan) =>
  get(crypto) ? plan.priceCrypto : plan.priceFiat;

watch(visible, (visible) => {
  if (!visible) {
    set(confirmed, false);
  }
});

onMounted(async () => await store.getPlans());

const css = useCssModule();
</script>

<template>
  <ModalDialog :model-value="visible">
    <div :class="css.body">
      <TextHeading no-margin>{{ t('change_plan.title') }}</TextHeading>
      <div
        v-for="plan in availablePlans"
        :key="plan.months.toString()"
        :class="{
          [css.plan]: true,
          [css.disabled]: warning && !confirmed,
        }"
        @click="select(plan.months)"
      >
        <div :class="css.name">
          {{ t('home.plans.names.plan', { name: getPlanName(plan.months) }) }}
        </div>
        {{ getPrice(plan) }}€
        <span v-if="vat">+ {{ t('common.vat', { vat }) }}</span>
        {{
          t(
            'selected_plan_overview.renew_period',
            { months: plan.months },
            plan.months,
          )
        }}
      </div>
      <div v-if="crypto && warning" :class="css.warning">
        <span>
          {{ t('change_plan.switch_warning') }}
        </span>
        <RuiCheckbox v-model="confirmed" class="mt-3" color="primary">
          <i18n-t keypath="change_plan.switch_agree" scope="global">
            <template #separator>
              <br />
            </template>
          </i18n-t>
        </RuiCheckbox>
      </div>
      <div :class="css.buttons">
        <RuiButton
          variant="outlined"
          size="lg"
          class="w-full"
          color="primary"
          @click="cancel()"
        >
          {{ t('actions.cancel') }}
        </RuiButton>
      </div>
    </div>
  </ModalDialog>
</template>

<style module lang="scss">
.body {
  @apply p-6 max-w-[30rem] w-full;
}

.plan {
  @apply focus:outline-none px-4 py-2 my-2 transition bg-white;
  @apply border-black/[0.12] border border-solid rounded;

  &:not(.disabled):hover {
    @apply bg-rui-primary/[0.09] cursor-pointer;
  }

  &:not(.disabled):active {
    @apply bg-rui-primary/[0.15] border-rui-primary;
  }

  &.disabled {
    @apply bg-gray-50 cursor-not-allowed opacity-60;
  }
}

.name {
  @apply font-bold;
}

.buttons {
  @apply flex flex-row justify-end mt-2;
}

.warning {
  @apply mt-4 text-justify;
}
</style>
