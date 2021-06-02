<template>
  <transition name="fade">
    <div :class="$style.overlay" @click="$emit('dismiss')">
      <div :class="$style.wrapper">
        <div :class="$style.dialog">
          <div :class="$style.row">
            <div :class="$style['icon-column']">
              <img
                alt="partial rotki logo"
                :class="$style.icon"
                src="~/assets/img/partial-logo.svg"
              />
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
              <img
                alt="Linux Download button"
                :class="$style.link"
                src="~/assets/img/dl/linux.svg"
              />
            </a>
            <a :href="macOSUrl" :class="$style.link" target="_blank">
              <img
                alt="macOS Download button"
                :class="$style.link"
                src="~/assets/img/dl/mac.svg"
              />
            </a>
            <a :href="windowsUrl" :class="$style.link" target="_blank">
              <img
                alt="Windows Download button"
                :class="$style.link"
                src="~/assets/img/dl/windows.svg"
              />
            </a>
          </div>
          <div v-if="version" :class="$style.row3">
            Latest Release: {{ version }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import Vue from 'vue'
import { NuxtAxiosInstance } from '@nuxtjs/axios'

const LATEST = 'https://github.com/rotki/rotki/releases/tag/latest'

type Asset = {
  readonly name: string
  // eslint-disable-next-line camelcase
  readonly browser_download_url: string
}

type GithubRelease = {
  // eslint-disable-next-line camelcase
  readonly tag_name: string
  readonly assets: Asset[]
}

function getUrl(assets: Asset[], filter: (asset: Asset) => boolean): string {
  const matched = assets.filter(filter)
  return matched.length === 0 ? LATEST : matched[0].browser_download_url
}

function isWindowApp(name: string): boolean {
  return name.endsWith('.exe') && name.startsWith('rotki-win32')
}

function isLinuxApp(name: string): boolean {
  return name.endsWith('.AppImage')
}

function isMacOsApp(name: string): boolean {
  return name.endsWith('.dmg')
}

export default Vue.extend({
  name: 'DownloadDialog',
  data() {
    return {
      version: '',
      linuxUrl: LATEST,
      macOSUrl: LATEST,
      windowsUrl: LATEST,
    }
  },
  async mounted() {
    await this.fetchLatestRelease()
  },
  methods: {
    async fetchLatestRelease() {
      // For some reason while the typescript instructions are followed
      // generate fails because it it can't find the $axios property.
      // This means that the merge of the context somehow fails
      const comp = this as any
      const $axios = comp.$axios as NuxtAxiosInstance
      const latestRelease: GithubRelease = await $axios.$get<GithubRelease>(
        'https://api.github.com/repos/rotki/rotki/releases/latest'
      )
      this.version = latestRelease.tag_name
      const assets: Asset[] = latestRelease.assets
      this.macOSUrl = getUrl(assets, ({ name }) => isMacOsApp(name))
      this.linuxUrl = getUrl(assets, ({ name }) => isLinuxApp(name))
      this.windowsUrl = getUrl(assets, ({ name }) => isWindowApp(name))
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.overlay {
  @apply w-screen h-screen overflow-y-hidden bg-opacity-50 bg-black z-30 fixed top-0;
}

.wrapper {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}

.dialog {
  @apply bg-white flex flex-col;

  border-radius: 40px;
  margin: 16px;
  width: 800px;
  height: 539px;
}

.icon-column {
  @apply flex flex-col col-auto;

  @include for-size(phone-only) {
    display: none;
  }
}

.title-column {
  @apply flex flex-col;

  padding-left: 61px;
  margin-top: 85px;

  @include for-size(phone-only) {
    padding-left: 16px;
  }
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
  padding-right: 16px;
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

  > * {
    margin-left: 8px;
    margin-right: 8px;
  }

  @include for-size(phone-only) {
    @apply flex-wrap;

    margin-top: 20px;
    padding-left: 16px;
    padding-right: 16px;

    > * {
      margin-left: auto;
      margin-right: auto;
      margin-top: 8px;

      > img {
        height: 50px;
      }
    }
  }
}

.row3 {
  @apply flex flex-row flex-wrap justify-center font-sans items-center;

  margin-top: 22px;
  text-align: center;

  @include text-size(16px, 34px);
}
</style>
