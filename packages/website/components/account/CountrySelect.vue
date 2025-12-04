<script setup lang="ts">
import { useCountries } from '~/composables/use-countries';

const modelValue = defineModel<string>({ required: true });

withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const { t } = useI18n({ useScope: 'global' });

const { countries } = useCountries();
</script>

<template>
  <RuiAutoComplete
    id="country"
    v-model="modelValue"
    variant="outlined"
    color="primary"
    autocomplete="country"
    :options="countries"
    :disabled="disabled"
    key-attr="code"
    text-attr="name"
    auto-select-first
    :label="t('auth.signup.address.form.country')"
    :item-height="46"
    :no-data-text="t('country_select.no_data')"
  >
    <template #item="{ item }">
      <div class="py-2">
        {{ item.name }}
      </div>
    </template>
  </RuiAutoComplete>
</template>
