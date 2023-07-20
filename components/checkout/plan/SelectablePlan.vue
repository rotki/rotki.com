<script setup lang="ts">
import { get } from '@vueuse/core';
import { type Plan } from '~/types';
import { getPlanName } from '~/utils/plans';

const props = defineProps<{
  plan: Plan;
  selected: boolean;
}>();

const emit = defineEmits<{ (e: 'click'): void }>();

const { plan } = toRefs(props);

const name = computed(() => getPlanName(get(plan).months));
const totalPrice = computed(() => get(plan).priceFiat);
const price = computed(() => {
  const { months, priceFiat } = get(plan);
  return (parseFloat(priceFiat) / months).toFixed(2);
});

const click = () => {
  emit('click');
};

const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.plan]: true,
      [css.selected]: selected,
    }"
    @click="click()"
  >
    <CheckMark class="-mr-12" :selected="selected" mt="-18px" />
    <div
      :class="{
        [css.emphasis]: true,
        [css.name]: true,
      }"
    >
      {{ name }}
    </div>
    <div
      :class="{
        [css.filler]: true,
        [css.for]: true,
      }"
    >
      for *
    </div>
    <div :class="css.emphasis">{{ price }}€</div>
    <div
      :class="{
        [css.filler]: true,
        [css.monthly]: true,
      }"
    >
      per month
    </div>
    <div :class="css.total">Total: {{ totalPrice }}€</div>
    <SelectionButton :class="css.button" :selected="selected">
      Choose Plan
    </SelectionButton>
    <div v-if="plan.discount" :class="css.discount">
      Save {{ plan.discount }}%
    </div>
  </div>
</template>

<style lang="scss" module>
%small {
  font-size: 16px;
  line-height: 19px;
  letter-spacing: 0;
}

.plan {
  @apply border border-solid border flex flex-col items-center w-full h-full p-8 cursor-pointer;

  background: 0 0 no-repeat padding-box;
  border-radius: 4px;
  border: 1px solid;

  &.selected {
    background-color: #fff;
    border-color: #da4e24;
    box-shadow: 0 4px 8px #0003;
  }

  &:not(.selected) {
    background-color: #f0f0f0;
    border-color: #d2d2d2;
  }
}

.emphasis {
  @apply font-bold;

  font-size: 28px;
  line-height: 33px;
  letter-spacing: 0;
  color: #212529;
}

.for {
  margin-top: 8px;
  margin-bottom: 8px;
}

.monthly {
  margin-top: 8px;
  margin-bottom: 24px;
}

.filler {
  @apply font-sans;

  color: #545454;
  opacity: 1;

  @extend %small;
}

.total {
  font-weight: bold;
  color: #212529;

  @extend %small;
}

.discount {
  color: #878787;

  @extend %small;
}

.button {
  margin-top: 16px;
  margin-bottom: 8px;
}
</style>
