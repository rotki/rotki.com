<script lang="ts" setup>
import type { DownloadItemSingle, DownloadItem as DownloadItemType } from '~/types/download';
import ButtonLink from '~/components/common/ButtonLink.vue';
import DownloadItem from '~/components/download/DownloadItem.vue';

const props = defineProps<{ version: string; links: DownloadItemType[] }>();
const { t } = useI18n({ useScope: 'global' });

const showAll = ref(false);

const sponsors = [
  {
    name: 'Tay',
    image: '/img/sponsorship-profiles/1.41.0_tay.png',
    gold: true,
  },
  {
    name: 'milady',
    image: '/img/sponsorship-profiles/1.41.0_milady.png',
  },
  {
    name: 'Slyde.eth',
    image: '/img/sponsorship-profiles/1.41.0_Slyde.eth.png',
  },
  {
    name: 'soxpert.eth',
    image: '/img/sponsorship-profiles/1.41.0_soxpert.eth.png',
  },
  {
    name: 'floar.eth',
    image: '/img/sponsorship-profiles/1.41.0_floar.eth.png',
  },
  {
    name: 'dsheets.eth',
    image: '/img/sponsorship-profiles/1.41.0_dsheets.eth.svg',
  },
];

function getOS() {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('win'))
    return 'WINDOWS';
  if (userAgent.includes('mac'))
    return 'MAC';
  if (userAgent.includes('linux'))
    return 'LINUX';

  return 'WINDOWS';
}

const highlightedDownloadItem = computed<DownloadItemSingle[]>(() => {
  const found = props.links.find(item => item.platform === getOS());
  if (!found)
    return [];

  if ('group' in found) {
    return found.items.map(item => ({
      icon: found.icon,
      url: item.url,
      platform: item.name,
    }));
  }

  return [found];
});
</script>

<template>
  <div class="py-10 lg:py-20">
    <div class="container flex flex-col">
      <div class="flex flex-col items-start gap-y-4">
        <h6 class="text-rui-light-primary text-h6 font-medium">
          {{ t('download.heading.download_rotki') }}
        </h6>
        <h3 class="text-rui-text text-h4">
          {{ t('download.heading.description') }}
        </h3>
        <div class="flex flex-col items-start gap-3 pt-2">
          <ClientOnly>
            <div class="flex gap-2 flex-wrap">
              <ButtonLink
                v-for="item in highlightedDownloadItem"
                :key="item.url"
                :to="item.url"
                rounded
                color="primary"
                variant="default"
                size="lg"
                data-cy="main-download-button"
              >
                <template #prepend>
                  <RuiIcon
                    v-if="item.icon"
                    :name="item.icon"
                    size="20"
                  />
                  <img
                    v-else-if="item.image"
                    :src="item.image"
                    :alt="item.platform"
                    width="20"
                    height="20"
                    loading="lazy"
                    class="brightness-0 invert"
                  />
                </template>
                {{ t('download.download_for', { platform: item.platform }) }}
              </ButtonLink>
            </div>
            <template #fallback>
              <div class="h-[42px]" />
            </template>
          </ClientOnly>

          <div class="pl-1">
            <RuiButton
              size="sm"
              variant="text"
              color="primary"
              class="!p-0 !text-sm underline"
              data-cy="show-all-download"
              @click="showAll = true"
            >
              {{ t('download.download_for_other_os') }}
            </RuiButton>

            <p class="text-sm text-rui-text-secondary">
              {{ t('download.latest_release') }}: {{ version }}
            </p>
          </div>
        </div>
      </div>

      <RuiAccordions :model-value="showAll ? [0] : []">
        <RuiAccordion eager>
          <div class="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 pt-8 md:pt-16 pb-6">
            <DownloadItem
              v-for="(link, i) in links"
              :key="i"
              :data="link"
              class="w-full"
            />
          </div>
        </RuiAccordion>
      </RuiAccordions>

      <div class="flex items-center mt-6 gap-12">
        <div class="flex flex-col mb-4 w-[150px]">
          <img
            src="/img/laurel.svg"
            alt="Sponsor laurel"
            width="150"
            height="100"
            loading="lazy"
            class="w-full"
          />
          <div class="text-center -mt-11 text-sm">
            <div>This release is</div>
            <div class="text-rui-text-secondary">
              Sponsored by:
            </div>
          </div>
        </div>
        <div class="flex-1 grid items-center md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 gap-y-8">
          <div
            v-for="(sponsor, index) in sponsors"
            :key="index"
            class="flex flex-col gap-3"
          >
            <img
              class="size-12 min-w-12 rounded-md overflow-hidden mx-auto"
              :class="{ 'size-20 min-w-20': sponsor.gold }"
              :src="sponsor.image"
              :alt="sponsor.name"
              :width="sponsor.gold ? 80 : 48"
              :height="sponsor.gold ? 80 : 48"
              loading="lazy"
            />
            <div class="flex flex-col items-center justify-between relative w-[12rem] max-w-full mx-auto">
              <NuxtImg
                v-if="sponsor.gold"
                src="/img/ribbon.png"
                alt="Gold sponsor ribbon"
                format="webp"
                width="192"
                height="48"
                loading="lazy"
                class="w-full h-[125%] absolute top-0 left-0 object-fill"
              />
              <div
                class="text-sm font-bold text-left text-rui-text-secondary relative"
                :class="{ 'text-yellow-900 max-w-[80%] px-0.5 text-center leading-8': sponsor.gold }"
              >
                {{ sponsor.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
