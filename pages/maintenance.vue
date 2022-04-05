<template>
  <div :class="$style.wrapper">
    <img
      :class="$style.image"
      alt="rotki maintenance"
      src="~/assets/img/maintenance.svg"
    />

    <heading :class="$style.heading">We'll be back soon!</heading>

    <div :class="$style.description">
      Sorry for the inconvenience but we're performing some maintenance at the
      moment. <br />
      If you need anything, you can always contact us on
      <a :class="$style.link" href="mailto:info@rotki.com" target="_blank">
        info@rotki.com
      </a>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, useRouter } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Maintenance',
  setup() {
    const router = useRouter()

    const isOnMaintenanceMode = process.env.maintenance === 'true'
    if (!isOnMaintenanceMode) {
      router.push('/')
    }
  },
})
</script>
<style lang="scss" module>
.wrapper {
  @apply w-full min-h-full flex flex-col items-center justify-center text-center py-28 px-8;
}

.image {
  width: 500px;
}

.link {
  @apply text-primary hover:text-primary3 font-bold;
}

.heading {
  @apply text-4xl;
}

.description {
  @apply font-sans text-typography text-base mt-8 text-center text-xl;
}
</style>
