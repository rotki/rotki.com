<script setup lang="ts">
const { token, step, plan, pending, loading, submit, reset } = useBraintree();
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <div v-if="!(token && plan)" class="flex justify-center my-10">
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
      <CardPayment
        v-else
        v-bind="slotProps"
        :loading="loading"
        :plan="plan"
        :token="token"
        @pay="submit($event)"
        @update:pending="pending = $event"
        @clear:errors="reset()"
      />
    </template>
  </PaymentFrame>
</template>
