<template>
  <div :class="$style.container">
    <div :class="$style.row">
      <div :class="$style.point">
        <div>1</div>
      </div>
      <div :class="$style.description">
        Please submit a payment request. Once that is done an email will be sent
        to your account with a payment request of the equivalent € amount of
        that cryptocurrency based on the rates given by
        <img
          alt="cryptocompare"
          src="~/assets/img/cryptocompare.png"
          :class="$style.cc"
        />
      </div>
    </div>
    <div :class="$style.row">
      <div :class="$style.point">
        <div>2</div>
      </div>
      <div :class="$style.description">
        Once the whole amount is sent and manually processed, then a receipt
        will be sent to your email and your subscription will be activated.
      </div>
    </div>
    <div :class="$style.row">
      <div :class="$style.point">
        <div>3</div>
      </div>
      <div :class="$style.description">
        Finally, when the end of the subscription period approaches an email
        with a prompt to generate another payment request will be sent.
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CryptoPaymentInfo',
})
</script>

<style module lang="scss">
.container {
  @apply mt-4;

  max-width: 600px;
}

.row {
  @apply flex flex-row mt-2;
}

.point {
  @apply flex flex-row items-center justify-center mt-1;

  background: rgba(218, 78, 36, 0.16) 0 0 no-repeat padding-box;
  border-radius: 50%;
  height: 24px;
  min-width: 24px;

  & div {
    @apply font-bold opacity-100;

    color: #da4e24;
    font-size: 14px;
    line-height: 21px;
  }
}

.description {
  @apply ml-2;
}

.cc {
  @apply inline-block ml-2;
}
</style>
