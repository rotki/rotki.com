<template>
  <CardContainer>
    <TextHeading :class="css.heading" subheading>API Credentials</TextHeading>
    <div :class="css.entry">
      <InputField
        id="api-key"
        :class="css.input"
        :model-value="apiKey"
        label="API Key"
        readonly
      />
      <div :class="css.col">
        <CopyButton :class="css.button" :model-value="apiKey" />
      </div>
    </div>
    <div :class="css.entry">
      <InputField
        id="api-secret"
        :class="css.input"
        :model-value="apiSecret"
        label="API Secret"
        readonly
      />
      <div :class="css.col">
        <CopyButton :class="css.button" :model-value="apiSecret" />
      </div>
    </div>
    <ActionButton
      :class="css.actionButton"
      primary
      small
      text="Regenerate"
      @click="regenerateKeys"
    />
  </CardContainer>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMainStore } from '~/store'

const store = useMainStore()
const { account } = storeToRefs(store)

const apiKey = computed(() => account.value?.apiKey ?? '')
const apiSecret = computed(() => account.value?.apiSecret ?? '')
const regenerateKeys = async () => await store.updateKeys()

const css = useCssModule()
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
