<script setup lang="ts">
import { get } from '@vueuse/core';

const emit = defineEmits<{ (e: 'dismiss'): void }>();

const LATEST = 'https://github.com/rotki/rotki/releases/latest';

type Asset = {
  readonly name: string;

  readonly browser_download_url: string;
};

type GithubRelease = {
  readonly tag_name: string;
  readonly assets: Asset[];
};

function getUrl(assets: Asset[], filter: (asset: Asset) => boolean): string {
  const matched = assets.filter(filter);
  return matched.length === 0 ? LATEST : matched[0].browser_download_url;
}

function isWindowApp(name: string): boolean {
  return name.endsWith('.exe') && name.startsWith('rotki-win32');
}

function isLinuxApp(name: string): boolean {
  return name.endsWith('.AppImage');
}

function isMacOsApp(name: string, arm64 = false): boolean {
  const archMatch =
    (arm64 && name.includes('arm64')) || (!arm64 && name.includes('x64'));
  return archMatch && name.endsWith('.dmg');
}

const version = ref('');
const linuxUrl = ref(LATEST);
const macOSUrl = ref(LATEST);
const macOSArmUrl = ref(LATEST);
const windowsUrl = ref(LATEST);

const fetchLatestRelease = async () => {
  const { data } = await useFetch<GithubRelease>(
    'https://api.github.com/repos/rotki/rotki/releases/latest',
  );
  const latestRelease = get(data);
  if (latestRelease) {
    version.value = latestRelease.tag_name;
    const assets: Asset[] = latestRelease.assets;
    macOSUrl.value = getUrl(assets, ({ name }) => isMacOsApp(name));
    macOSArmUrl.value = getUrl(assets, ({ name }) => isMacOsApp(name, true));
    linuxUrl.value = getUrl(assets, ({ name }) => isLinuxApp(name));
    windowsUrl.value = getUrl(assets, ({ name }) => isWindowApp(name));
  }
};
onBeforeMount(async () => await fetchLatestRelease());

const css = useCssModule();
</script>

<template>
  <Transition name="fade">
    <div :class="css.overlay" @click="emit('dismiss')">
      <div :class="css.wrapper">
        <div :class="css.dialog">
          <div :class="css.row">
            <div :class="css['icon-column']">
              <img
                :class="css.icon"
                alt="partial rotki logo"
                src="/img/partial-logo.svg"
              />
            </div>
            <div :class="css['title-column']">
              <div :class="css.title">Download Rotki</div>
              <div :class="css.description">
                You can download Rotki in your computer and start using it for
                free right now. Binaries available for all major Operating
                Systems.
              </div>
            </div>
          </div>
          <div :class="css.row2">
            <a :class="css.link" :href="linuxUrl" download>
              <img
                :class="css.link"
                alt="Linux Download button"
                src="/img/dl/linux.svg"
              />
            </a>
            <a :class="css.link" :href="macOSArmUrl" download>
              <img
                :class="css.link"
                alt="macOS Apple Silicon Mac Download button"
                src="/img/dl/mac_apple.svg"
              />
            </a>
            <a :class="css.link" :href="macOSUrl" download>
              <img
                :class="css.link"
                alt="macOS Intel Mac Download button"
                src="/img/dl/mac.svg"
              />
            </a>

            <a :class="css.link" :href="windowsUrl" download>
              <img
                :class="css.link"
                alt="Windows Download button"
                src="/img/dl/windows.svg"
              />
            </a>
          </div>
          <div v-if="version" :class="css.row3">
            Latest Release: {{ version }}
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

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
  padding-left: 30px;
  padding-right: 30px;

  > * {
    margin-left: 8px;
    margin-right: 8px;
    > img {
      height: 100%;
      max-height: 60px;
    }
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
