<template>
  <div :class="$style.wrapper">
    <div :class="$style.row">
      <div :class="$style.column1">
        <img :class="$style.image" src="~/assets/img/space.svg" />
      </div>
      <div :class="$style.column2">
        <div :class="$style.title">Want a custom tailored plan?</div>
        <div :class="$style.content">
          Get in touch with us to tailor the plan to your needs.
        </div>
        <div :class="$style.button">
          <action-button text="Get in touch now" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'CustomPlan',
})
</script>

<style module>
.wrapper {
  @apply container mx-auto;

  margin-top: 7.6875rem;
  padding-bottom: 4.25rem;
}

.title {
  @apply font-bold font-serif text-shade11;

  font-size: 2.88888rem;
  line-height: 3.7222rem;
  letter-spacing: -0.03em;
}

.content {
  @apply font-sans text-primary2 flex flex-col;

  font-size: 1.3333rem;
  line-height: 1.7777rem;
  margin-top: 1.2222rem;
}

.button {
  margin-top: 2.6666rem;
}

.row {
  @apply flex flex-row align-middle flex-wrap;

  height: 33.5rem;
}

.column1 {
  @apply flex flex-col col-span-12 md:col-end-5;

  @media only screen and (max-width: 1023px) {
    width: 100%;
  }
  @media only screen and (min-width: 1024px) {
    width: 33%;
  }
}

.column2 {
  @apply flex flex-col col-span-12 md:col-span-7  self-center;

  @media only screen and (max-width: 1023px) {
    margin-top: 4rem;
  }
  @media only screen and (min-width: 1024px) {
    margin-top: 0;
  }
}

.image {
  position: absolute;
  left: -12.94444rem;
  @media only screen and (max-width: 1023px) {
    position: relative !important;
    left: inherit !important;
  }

  @media only screen and (max-width: 1023px) {
    position: relative !important;
    left: inherit !important;
  }

  @media only screen and (min-width: 2200px) {
    padding-right: 4rem;
    position: relative !important;
    left: inherit !important;
  }
}
</style>
