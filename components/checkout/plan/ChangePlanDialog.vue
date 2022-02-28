<template>
  <modal-dialog :value="visible">
    <div :class="$style.body">
      <heading no-margin>Change Plan</heading>
      <div
        v-for="plan in plans"
        :key="plan.months.toString()"
        :class="$style.plan"
        @click="select(plan.months)"
      >
        <heading subheading no-margin>
          {{ getPlanName(plan.months) }} Plan.
        </heading>
        {{ plan.priceFiat }}€ <span v-if="false">+ {{ plan }}% VAT</span> every
        {{ plan.months }} months
      </div>
      <div :class="$style.buttons">
        <action-button text="Cancel" primary small @click="cancel" />
      </div>
    </div>
  </modal-dialog>
</template>

<script lang="ts">
import { asyncComputed } from '@vueuse/core'
import { defineComponent } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { getPlanName } from '~/components/checkout/plan/utils'

export default defineComponent({
  name: 'PlanSwitchDialog',
  props: {
    visible: {
      required: true,
      type: Boolean,
    },
  },
  emits: ['cancel', 'select'],
  setup(_, { emit }) {
    const { premium } = useMainStore()
    const plans = asyncComputed(async () => {
      const response = await premium()
      if (response.isError) {
        return []
      }
      return response.result.plans
    })

    const cancel = () => emit('cancel')
    const select = (months: number) => emit('select', months)

    return {
      plans,
      getPlanName,
      select,
      cancel,
    }
  },
})
</script>

<style module lang="scss">
.body {
  padding: 24px;
}

.plan {
  @apply font-sans rounded focus:outline-none px-4 py-2 my-2 border-primary3 border-2;

  background-position: center;
  transition: background 0.8s;

  &:hover {
    background: rgba(218, 78, 36, 0.3)
      radial-gradient(circle, transparent 1%, rgba(218, 78, 36, 0.3) 1%)
      center/15000%;
  }

  &:active {
    @apply bg-primary3;

    background-size: 100%;
    transition: background 0s;
  }
}

.buttons {
  @apply flex flex-row justify-end mt-2;
}
</style>
