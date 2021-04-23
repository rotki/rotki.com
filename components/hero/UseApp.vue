<template>
  <div :class="$style.wrapper">
    <div :class="$style.col">
      <img src="~/assets/img/accountant.svg" :class="$style.image" />
    </div>
    <div :class="$style.column2">
      <div :class="$style.row">
        <div :class="$style.text">
          Rotki offers tracking of all your crypto assets no matter where they
          are. Either on a blockchain or on one of the supported exchanges.
        </div>
      </div>
      <download-button :class="$style.button" @click="$emit('download')" />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'UseApp',
})
</script>

<style module>
.wrapper {
  @apply flex flex-row justify-center align-middle;

  margin-top: 129px;
}

.row {
  @apply flex flex-row;
}

.col {
  @apply flex-col;
}

.column2 {
  @apply flex-col col-auto self-center;

  margin-left: 200px;
  max-width: 650px;
}

.text {
  @apply flex-col text-shade8 font-regular align-middle;

  font-size: 32px;
  line-height: 50px;
}

.button {
  margin-top: 64px;
}

.image {
  margin: 0;
}
</style>
