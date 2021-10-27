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
import { defineComponent } from '@nuxtjs/composition-api'

type Section = {
  id: string
  name: string
  wide?: boolean
}
type Data = {
  sticky: Boolean
  visible: Boolean
  active: string
  offsetTop: number
  premium: HTMLElement | null
  sections: Section[]
  offsets: { [id: string]: number }
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
  data(): Data {
    return {
      sticky: false,
      visible: true,
      active: '',
      offsetTop: 0,
      premium: null,
      sections,
      offsets: {},
    }
  },
  computed: {
    sectionIds() {
      return sections.map(({ id }) => id).reverse()
    },
  },
  beforeMount() {
    document.addEventListener('scroll', this.handleScroll)
    this.premium = document.getElementById('premium')
  },
  beforeDestroy() {
    document.removeEventListener('scroll', this.handleScroll)
  },
  mounted() {
    this.offsetTop = (this.$refs.menu as HTMLElement).offsetTop

    for (let i = 0; i < this.sectionIds.length; i++) {
      const section = this.sectionIds[i]
      const sectionElement = document.getElementById(section.replace('#', ''))
      this.offsets[section] = sectionElement?.offsetTop ?? 0
    }
  },
  methods: {
    handleScroll() {
      const offset = window.pageYOffset
      const premium = this.premium as HTMLElement
      this.sticky = offset >= this.offsetTop
      this.visible = offset < premium.offsetTop
      this.$emit('sticky', this.sticky)

      if (!this.visible && !this.sticky) {
        return
      }

      for (const sectionId of this.sectionIds) {
        if (this.offsets[sectionId] <= offset) {
          this.active = sectionId
          break
        }
      }
    },
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
