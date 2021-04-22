<template>
  <div>
    <div :class="$style.column1">
      <img :class="$style.image" src="~/assets/img/space.svg" />
    </div>
    <div :class="$style.wrapper">
      <div :class="$style.row">
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

  margin-top: 247px;
  padding-bottom: 400px;
}

.title {
  @apply font-bold font-serif text-shade11;

  font-size: 52px;
  line-height: 67px;
  letter-spacing: -0.03em;
}

.content {
  @apply font-sans text-primary2 flex flex-col;

  font-size: 24px;
  line-height: 32px;
  margin-top: 22px;
}

.button {
  margin-top: 48px;
}

.row {
  @apply flex flex-row align-middle flex-wrap;
}

.column1 {
  position: relative;
}

.column2 {
  @apply flex flex-col col-span-12 md:col-span-7  self-center;

  margin-left: 400px;
}

.image {
  position: absolute;
  left: -233px;
  top: -150px;
  width: 625px;
  height: 603px;

  @media only screen and (min-width: 2200px) {
    left: 250px;
  }
}
</style>
