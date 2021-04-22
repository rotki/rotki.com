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
  @apply flex flex-col;

  width: 33%;
  margin-top: 48px;

  @media only screen and (max-width: 855px) {
    width: 100%;
  }
}

.protocol {
  width: 320px;
}

.image {
  width: 50px;
}

.title-wrapper {
  @apply flex flex-row align-middle;
}

.title {
  @apply font-serif font-bold text-shade11 flex-col flex self-center;

  margin-left: 18px;
  font-size: 24px;
  line-height: 31px;
  letter-spacing: -0.03em;
}

.description {
  @apply font-sans text-primary2;

  margin-top: 27px;
  font-size: 20px;
  line-height: 32px;
}
</style>
