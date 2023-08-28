<script setup lang="ts">
import { get } from '@vueuse/core';
import { type Country } from '~/composables/countries';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { modelValue } = toRefs(props);

const { t } = useI18n();

const { countries } = useCountries();

const country = computed({
  get() {
    return get(countries).find(({ code }) => code === get(modelValue)) || null;
  },
  set(item: Country | null) {
    emit('update:modelValue', item ? item.code : '');
  },
});
</script>

<template>
  <RuiAutoComplete
    id="country"
    v-model="country"
    variant="outlined"
    color="primary"
    autocomplete="country"
    :data="countries"
    :disabled="disabled"
    key-prop="code"
    text-prop="name"
    :label="t('auth.signup.address.form.country')"
  >
    <template #no-data>
      {{ t('country_select.no_data') }}
    </template>
  </RuiAutoComplete>
</template>
