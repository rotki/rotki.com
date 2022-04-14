<template>
  <card>
    <heading :class="$style.heading" subheading>API Credentials</heading>
    <div :class="$style.entry">
      <input-field
        id="api-key"
        :class="$style.input"
        :value="apiKey"
        label="API Key"
        readonly
      />
      <div :class="$style.col">
        <copy-button :class="$style.button" :value="apiKey" />
      </div>
    </div>
    <div :class="$style.entry">
      <input-field
        id="api-secret"
        :class="$style.input"
        :value="apiSecret"
        label="API Secret"
        readonly
      />
      <div :class="$style.col">
        <copy-button :class="$style.button" :value="apiSecret" />
      </div>
    </div>
    <action-button
      :class="$style.actionButton"
      primary
      small
      text="Regenerate"
      @click="regenerateKeys"
    />
  </card>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'ApiKeys',
  setup() {
    const store = useMainStore()
    // pinia#852
    const { account } = toRefs(store)

    const apiKey = computed(() => account.value?.apiKey ?? '')
    const apiSecret = computed(() => account.value?.apiSecret ?? '')
    const regenerateKeys = async () => await store.updateKeys()

    return {
      regenerateKeys,
      apiKey,
      apiSecret,
    }
  },
})
</script>

<style lang="scss" module>
.col {
  @apply flex flex-col;
}

.row {
  @apply py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8;
}

.entry {
  @apply flex flex-row min-w-full items-end;
}

.input {
  @apply flex-grow;
}

.button {
  @apply ml-3 mb-2.5;
}

.actionButton {
  @apply mt-3;
}

.heading {
  @apply my-4;
}
</style>
