<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account } = storeToRefs(store);

const apiKey = computed(() => account.value?.apiKey ?? '');
const apiSecret = computed(() => account.value?.apiSecret ?? '');
const hasApiKeys = computed(() => apiKey.value && apiSecret.value);
const showKey = ref(false);
const showSecret = ref(false);

const regenerateKeys = async () => await store.updateKeys();

const css = useCssModule();
</script>

<template>
  <CardContainer>
    <TextHeading :class="css.heading" subheading>API Credentials</TextHeading>
    <div :class="css.entry">
      <InputField
        id="api-key"
        :class="css.input"
        :model-value="apiKey"
        :type="showKey ? 'text' : 'password'"
        label="API Key"
        readonly
      />
      <VisibilityButton v-model="showKey" :class="css.toggle" />
      <div :class="css.col">
        <CopyButton :class="css.button" :model-value="apiKey" />
      </div>
    </div>
    <div :class="css.entry">
      <InputField
        id="api-secret"
        :class="css.input"
        :model-value="apiSecret"
        :type="showSecret ? 'text' : 'password'"
        label="API Secret"
        readonly
      />
      <VisibilityButton v-model="showSecret" :class="css.toggle" />
      <div :class="css.col">
        <CopyButton :class="css.button" :model-value="apiSecret" />
      </div>
    </div>
    <ActionButton
      :class="css.actionButton"
      primary
      small
      :text="hasApiKeys ? 'Regenerate' : 'Generate'"
      @click="regenerateKeys"
    />
  </CardContainer>
</template>

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
  @apply ml-3 mt-1.5;
}

.toggle {
  @apply ml-3 mt-1 mr-0 mb-0;
}

.actionButton {
  @apply mt-3;
}

.heading {
  @apply my-4;
}
</style>
