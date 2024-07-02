<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const { t } = useI18n();

const { countries } = useCountries();

const modelValue = defineModel<string>({ required: true });
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
