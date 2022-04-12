<template>
  <modal-dialog :value="visible">
    <div :class="$style.body">
      <heading no-margin>Change Plan</heading>
      <div
        v-for="plan in plans"
        :key="plan.months.toString()"
        :class="{
          [$style.plan]: true,
          [$style.disabled]: !confirmed,
        }"
        @click="select(plan.months)"
      >
        <div :class="$style.name">{{ getPlanName(plan.months) }} Plan.</div>
        {{ getPrice(plan) }}€ <span v-if="false">+ {{ plan }}% VAT</span> every
        {{ plan.months }} months
      </div>
      <div v-if="crypto && warning" :class="$style.warning">
        <span>
          Switching a plan after sending a payment can lead to problems with the
          activation of your subscription. Please only switch a plan if no
          payment has been send.
        </span>
        <custom-checkbox v-model="confirmed">
          I confirm that no payment has been send. <br />
          Allow me to switch the plan
        </custom-checkbox>
      </div>
      <div :class="$style.buttons">
        <action-button text="Cancel" primary small @click="cancel" />
      </div>
    </div>
  </modal-dialog>
</template>

<script lang="ts">
import { get, set, toRefs } from '@vueuse/core'
import { defineComponent, onMounted, ref, watch } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { getPlanName } from '~/utils/plans'
import { Plan } from '~/types'

export default defineComponent({
  name: 'PlanSwitchDialog',
  props: {
    visible: {
      required: true,
      type: Boolean,
    },
    crypto: {
      required: false,
      type: Boolean,
      default: false,
    },
    warning: {
      required: true,
      type: Boolean,
      default: false,
    },
  },
  emits: ['cancel', 'select'],
  setup(props, { emit }) {
    const store = useMainStore()
    const { plans } = toRefs(store)
    const { crypto, visible } = toRefs(props)
    const confirmed = ref(false)

    const cancel = () => emit('cancel')
    const select = (months: number) => {
      if (!get(confirmed)) {
        return
      }
      return emit('select', months)
    }
    onMounted(async () => await store.getPlans())

    const getPrice = (plan: Plan) => {
      return get(crypto) ? plan.priceCrypto : plan.priceFiat
    }

    watch(visible, (visible) => {
      if (!visible) {
        set(confirmed, false)
      }
    })

    return {
      plans,
      confirmed,
      getPrice,
      getPlanName,
      select,
      cancel,
    }
  },
})
</script>

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
