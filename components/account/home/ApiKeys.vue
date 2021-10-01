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
  </card>
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
