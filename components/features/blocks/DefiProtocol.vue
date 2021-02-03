<template>
  <div :class="$style.wrapper">
    <div :class="$style.protocol">
      <div :class="$style['title-wrapper']">
        <div v-if="image">
          <img :src="image" :class="$style.image" />
        </div>
        <div :class="$style.title">
          <slot name="name" />
        </div>
      </div>
      <div :class="$style.description">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'DefiProtocol',
  props: {
    image: {
      required: false,
      default: '',
      type: String,
    },
  },
})
</script>

<style module>
.wrapper {
  @apply flex flex-col col-span-12 md:col-span-4;

  width: 33%;
  margin-top: 2.66666rem;

  @media only screen and (max-width: 855px) {
    width: 100%;
  }
}

.protocol {
  width: 19rem;
}

.image {
  width: 50px;
}

.title-wrapper {
  @apply flex flex-row align-middle;
}

.title {
  @apply font-serif font-bold text-shade11 flex-col flex self-center;

  margin-left: 0.94444rem;
  font-size: 1.33333rem;
  line-height: 1.72222rem;
  letter-spacing: -0.03em;
}

.description {
  @apply font-sans text-primary2;

  margin-top: 0.94444rem;
  font-size: 1.11111rem;
  line-height: 1.77777rem;
}
</style>
