<template>
  <div :class="$style.overlay" @click="$emit('dismiss')">
    <div :class="$style.wrapper">
      <div :class="$style.dialog">
        <div :class="$style.row">
          <div :class="$style['icon-column']">
            <img :class="$style.icon" src="~/assets/img/partial-logo.svg" />
          </div>
          <div :class="$style['title-column']">
            <div :class="$style.title">Download Rotki</div>
            <div :class="$style.description">
              You can download Rotki in your computer and start using it for
              free right now. Binaries available for all major Operating
              Systems.
            </div>
          </div>
        </div>
        <div :class="$style.row2">
          <a :href="linuxUrl" :class="$style.link" target="_blank">
            <img :class="$style.link" src="~/assets/img/dl/linux.svg" />
          </a>
          <a :href="osxUrl" :class="$style.link" target="_blank">
            <img :class="$style.link" src="~/assets/img/dl/mac.svg" />
          </a>
          <a :href="windowsUrl" :class="$style.link" target="_blank">
            <img :class="$style.link" src="~/assets/img/dl/windows.svg" />
          </a>
        </div>
        <div :class="$style.row3">Latest Release: {{ version }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'DownloadDialog',
  data() {
    return {
      version: 'v1.13.2',
      linuxUrl: '',
      osxUrl: '',
      windowsUrl: '',
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media.scss';
@import '~assets/css/main.scss';

.overlay {
  @apply w-screen h-screen overflow-y-hidden bg-opacity-50 bg-black z-30 fixed top-0;
}

.wrapper {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}

.dialog {
  @apply bg-white flex flex-col;

  border-radius: 40px;
  width: 800px;
  height: 539px;
}

.icon-column {
  @apply flex flex-col col-auto;
}

.title-column {
  @apply flex flex-col;

  padding-left: 61px;
  margin-top: 85px;
}

.icon {
  height: 277px;
  width: 350px;
}

.title {
  @apply font-serif font-bold text-shade11;

  letter-spacing: -0.03em;

  @include text-size(52px, 67px);
}

.description {
  @apply font-sans text-primary2;

  margin-top: 30px;
  letter-spacing: -0.03em;
  @include text-size(24px, 34px);
}

.row {
  @apply flex flex-row;
}

.row2 {
  @apply flex flex-row items-center justify-between;

  margin-top: 90px;
  padding-left: 40px;
  padding-right: 40px;
}

.row3 {
  @apply flex flex-row flex-wrap justify-center font-sans items-center;

  margin-top: 22px;
  text-align: center;

  @include text-size(16px, 34px);
}
</style>
