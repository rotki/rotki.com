<template>
  <div :class="css.wrapper">
    <div :class="css.column">
      <a href="https://github.com/rotki" rel="noreferrer" target="_blank">
        <img :class="css.link" alt="Github" src="/img/github.svg" />
      </a>
    </div>
    <div :class="css.column">
      <a href="https://twitter.com/rotkiapp" rel="noreferrer" target="_blank">
        <img :class="css.link" alt="Twitter" src="/img/twitter.svg" />
      </a>
    </div>
    <div :class="css.column">
      <a href="https://discord.gg/aGCxHG7" rel="noreferrer" target="_blank">
        <img :class="css.link" alt="Discord" src="/img/discord.svg" />
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const css = useCssModule()
</script>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

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
