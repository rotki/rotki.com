<template>
  <div :class="$style.wrapper">
    <div ref="menu" :class="$style.menu">
      <div
        v-for="section in sections"
        :key="section.id"
        :class="{
          [$style.wide]: section.wide,
          [$style.normal]: !section.wide,
          [$style.active]: section.id === active,
        }"
      >
        <a :href="section.id">{{ section.name }}</a>
      </div>
    </div>
    <div
      v-if="sticky && visible"
      ref="sticky"
      :class="{
        [$style.menu]: true,
        [$style.sticky]: sticky,
      }"
    >
      <div
        v-for="section in sections"
        :key="section.id"
        :class="{
          [$style.wide]: section.wide,
          [$style.normal]: !section.wide,
          [$style.active]: section.id === active,
        }"
      >
        <a :href="section.id">{{ section.name }}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
} from '@nuxtjs/composition-api'

type Section = {
  id: string
  name: string
  wide?: boolean
}

const sections: Section[] = [
  {
    id: '#dashboard',
    name: 'Dashboard',
  },
  {
    id: '#exchanges',
    name: 'Exchanges',
  },
  {
    id: '#defi',
    name: 'DeFi',
  },
  {
    id: '#defi-details',
    name: 'Ethereum Protocols',
    wide: true,
  },
  {
    id: '#profitloss-report',
    name: 'Profit/Loss Report',
    wide: true,
  },
]

export default defineComponent({
  name: 'MiddleMenu',
  emits: ['sticky'],
  setup(_, { emit }) {
    const sticky = ref(false)
    const visible = ref(true)
    const active = ref('')
    const offsetTop = ref(0)
    const premium = ref<HTMLElement | null>(null)
    const menu = ref<HTMLDivElement | null>(null)
    const offsets = ref<Record<string, number>>({})

    const sectionIds = sections.map(({ id }) => id).reverse()

    const handleScroll = () => {
      const offset = window.scrollY
      sticky.value = offset >= offsetTop.value
      visible.value = offset < (premium.value?.offsetTop ?? 0)
      emit('sticky', sticky.value)

      if (!visible.value && !sticky.value) {
        return
      }

      for (const sectionId of sectionIds) {
        if (offsets.value[sectionId] <= offset) {
          active.value = sectionId
          break
        }
      }
    }

    onMounted(() => {
      offsetTop.value = menu.value?.offsetTop ?? 0

      for (let i = 0; i < sectionIds.length; i++) {
        const section = sectionIds[i]
        const sectionElement = document.getElementById(section.replace('#', ''))
        offsets.value = {
          ...offsets.value,
          [section]: sectionElement?.offsetTop ?? 0,
        }
      }
    })

    onBeforeMount(() => {
      document.addEventListener('scroll', handleScroll)
      premium.value = document.getElementById('premium')
    })

    onBeforeUnmount(() => {
      document.removeEventListener('scroll', handleScroll)
    })
    return {
      sticky,
      visible,
      active,
      offsetTop,
      premium,
      menu,
      sections,
      sectionIds,
      offsets: {},
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  padding-top: 16px;
  margin-top: calc(145px - 16px);

  @include for-size(phone-only) {
    display: none;
  }
}

.menu {
  @apply flex flex-row font-sans justify-center font-light text-center;

  @include text-size(24px, 32px);
}

.sticky {
  @apply bg-background;

  position: fixed;
  top: 0;
  width: 100%;
  margin-top: 0 !important;
  margin-left: auto;
  margin-right: auto;
  padding: 16px;
  z-index: 2;
}

.wide {
  @apply flex-col;

  margin-left: 20px;
  margin-right: 20px;

  @include for-size(desktop-up) {
    width: 200px;
  }
  @include for-size(big-desktop-up) {
    width: 250px;
  }
}

.normal {
  @apply flex-col;

  width: 120px;
  margin-left: 20px;
  margin-right: 20px;
}

.active {
  @apply text-primary font-medium;
}
</style>
