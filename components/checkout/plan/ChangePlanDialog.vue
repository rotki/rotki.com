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
    crypto?: boolean;
    warning?: boolean;
  }>(),
  {
    crypto: false,
    warning: false,
  }
);

const emit = defineEmits<{
  (e: 'cancel'): void;
  (e: 'select', months: number): void;
}>();
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
      <TextHeading no-margin>Change Plan</TextHeading>
      <div
        v-for="plan in availablePlans"
        :key="plan.months.toString()"
        :class="{
          [css.plan]: true,
          [css.disabled]: warning && !confirmed,
        }"
        @click="select(plan.months)"
      >
        <div :class="css.name">{{ getPlanName(plan.months) }} Plan.</div>
        {{ getPrice(plan) }}€ <span v-if="false">+ {{ plan }}% VAT</span> every
        {{ plan.months }} months
      </div>
      <div v-if="crypto && warning" :class="css.warning">
        <span>
          Switching a plan after sending a payment can lead to problems with the
          activation of your subscription. Please only switch a plan if no
          payment has been send.
        </span>
        <CustomCheckbox v-model="confirmed">
          I confirm that no payment has been send. <br />
          Allow me to switch the plan
        </CustomCheckbox>
      </div>
      <div :class="css.buttons">
        <ActionButton text="Cancel" primary small @click="cancel()" />
      </div>
    </div>
  </ModalDialog>
</template>

<style module lang="scss">
.body {
  max-width: 450px;
  padding: 24px;
}

.plan {
  @apply font-sans rounded focus:outline-none px-4 py-2 my-2 border-primary3 border-2;

  background-position: center;
  transition: background 0.8s;

  &:not(.disabled):hover {
    background: rgba(218, 78, 36, 0.3)
      radial-gradient(circle, transparent 1%, rgba(218, 78, 36, 0.3) 1%)
      center/15000%;
  }

  &:not(.disabled):active {
    @apply bg-primary3;

    background-size: 100%;
    transition: background 0s;
  }

  &.disabled {
    @apply bg-gray-50 cursor-not-allowed;
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
