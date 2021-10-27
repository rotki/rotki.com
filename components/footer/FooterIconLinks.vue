<template>
  <div :class="$style.wrapper">
    <div :class="$style.column">
      <a href="https://github.com/rotki" rel="noreferrer" target="_blank">
        <img :class="$style.link" alt="Github" src="~/assets/img/github.svg" />
      </a>
    </div>
    <div :class="$style.column">
      <a href="https://twitter.com/rotkiapp" rel="noreferrer" target="_blank">
        <img
          :class="$style.link"
          alt="Twitter"
          src="~/assets/img/twitter.svg"
        />
      </a>
    </div>
    <div :class="$style.column">
      <a href="https://discord.gg/aGCxHG7" rel="noreferrer" target="_blank">
        <img
          :class="$style.link"
          alt="Discord"
          src="~/assets/img/discord.svg"
        />
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'FooterIconLinks',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply flex flex-row;

  @include for-size(phone-only) {
    margin-top: 40px;
  }
}

.column {
  @apply flex flex-col;

  margin-left: 16px;
  margin-right: 16px;
}

.link {
  &:hover {
    @apply hover:opacity-75;
  }
}
</style>
