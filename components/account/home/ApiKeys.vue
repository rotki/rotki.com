<template>
  <div :class="$style.col">
    <div :class="$style.row">
      <heading :class="$style.heading">Api Credentials</heading>
      <div :class="$style.card">
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
            id="api-key"
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
          :class="$style.button"
          primary
          small
          text="Regenerate"
          @click="regenerateKeys"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { computed, useStore } from '@nuxtjs/composition-api'
import { Actions, RootState } from '~/store'

export default defineComponent({
  name: 'ApiKeys',
  setup() {
    const store = useStore<RootState>()

    const apiKey = computed(() => store.state.account?.api_key ?? '')
    const apiSecret = computed(() => store.state.account?.api_secret ?? '')

    const regenerateKeys = async () => {
      await store.dispatch(Actions.UPDATE_KEYS)
    }
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

.card {
  @apply shadow overflow-hidden border-b border-gray-200 sm:rounded-lg mt-2 p-4 bg-white;
}

.entry {
  @apply flex flex-row min-w-full items-center;
}

.input {
  @apply flex-grow;
}

.button {
  @apply ml-2 mt-4;
}

.heading {
  @apply my-4;
}
</style>
