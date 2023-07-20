<script setup lang="ts">
const emit = defineEmits<{ (e: 'sticky', value: boolean): void }>();

type Section = {
  id: string;
  name: string;
  wide?: boolean;
};

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
    name: 'Ethereum protocols',
    wide: true,
  },
  {
    id: '#profitloss-report',
    name: 'Profit/loss report',
    wide: true,
  },
];

const sticky = ref(false);
const visible = ref(true);
const active = ref('');
const offsetTop = ref(0);
const premium = ref<HTMLElement | null>(null);
const menu = ref<HTMLDivElement | null>(null);
const offsets = ref<Record<string, number>>({});

const sectionIds = sections.map(({ id }) => id).reverse();

const handleScroll = () => {
  const offset = window.scrollY;
  sticky.value = offset >= offsetTop.value;
  visible.value = offset < (premium.value?.offsetTop ?? 0);
  emit('sticky', sticky.value);

  if (!visible.value && !sticky.value) {
    return;
  }

  for (const sectionId of sectionIds) {
    if (offsets.value[sectionId] <= offset) {
      active.value = sectionId;
      break;
    }
  }
};

onMounted(() => {
  offsetTop.value = menu.value?.offsetTop ?? 0;

  for (const section of sectionIds) {
    const sectionElement = document.getElementById(section.replace('#', ''));
    offsets.value = {
      ...offsets.value,
      [section]: sectionElement?.offsetTop ?? 0,
    };
  }
});

onBeforeMount(() => {
  document.addEventListener('scroll', handleScroll);
  premium.value = document.getElementById('premium');
});

onBeforeUnmount(() => {
  document.removeEventListener('scroll', handleScroll);
});

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <div ref="menu" :class="css.menu">
      <div
        v-for="section in sections"
        :key="section.id"
        :class="{
          [css.wide]: section.wide,
          [css.normal]: !section.wide,
          [css.active]: section.id === active,
        }"
      >
        <a :href="section.id">{{ section.name }}</a>
      </div>
    </div>
    <div
      v-if="sticky && visible"
      ref="sticky"
      :class="{
        [css.menu]: true,
        [css.sticky]: sticky,
      }"
    >
      <div
        v-for="section in sections"
        :key="section.id"
        :class="{
          [css.wide]: section.wide,
          [css.normal]: !section.wide,
          [css.active]: section.id === active,
        }"
      >
        <a :href="section.id">{{ section.name }}</a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.wrapper {
  padding-top: 16px;
  margin-top: calc(145px - 16px);

  @include for-size(phone-only) {
    display: none;
  }
}

.menu {
  @apply flex flex-row justify-center font-light text-center;

  @include text-size(24px, 32px);
}

.sticky {
  @apply bg-rui-grey-100;

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
  @apply text-rui-primary font-medium;
}
</style>
