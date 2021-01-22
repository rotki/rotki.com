<template>
  <div :class="$style.wrapper">
    <div :class="$style.column">
      <a href="https://github.com/rotki" target="_blank">
        <img src="~/assets/img/github.svg" alt="Github" :class="$style.link" />
      </a>
    </div>
    <div :class="$style.column">
      <a href="https://twitter.com/rotkiapp" target="_blank">
        <img
          src="~/assets/img/twitter.svg"
          alt="Twitter"
          :class="$style.link"
        />
      </a>
    </div>
    <div :class="$style.column">
      <a href="https://discord.gg/aGCxHG7" target="_blank">
        <img
          src="~/assets/img/discord.svg"
          alt="Discord"
          :class="$style.link"
        />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'FooterIconLinks',
})
</script>

<style module>
.wrapper {
  @apply flex flex-row;
}

.column {
  @apply flex flex-col;

  margin-left: 0.8rem;
  margin-right: 0.8rem;
}

.link {
  &:hover {
    @apply hover:opacity-75;
  }
}
</style>
