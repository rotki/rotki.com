<script setup lang="ts">
import { isOnlyDigits, PASSWORD_MIN_LENGTH } from '~/utils/validation';

const { password, errors, invalid = false } = defineProps<{
  password: string;
  /** Messages from the backend, which checks the rules this page cannot (common or too similar). */
  errors?: string[] | string;
  /** Marks the unmet rules as errors, once the user tried to continue. */
  invalid?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const errorList = computed<string[]>(() => {
  if (!errors)
    return [];
  return Array.isArray(errors) ? errors : [errors];
});

const rules = computed<{ key: string; label: string; met: boolean }[]>(() => [{
  key: 'length',
  label: t('auth.common.password_rules.min_length'),
  met: password.length >= PASSWORD_MIN_LENGTH,
}, {
  key: 'numeric',
  label: t('auth.common.password_rules.not_numeric'),
  met: password.length > 0 && !isOnlyDigits(password),
}]);
</script>

<template>
  <div class="pt-1 text-caption text-rui-text-secondary space-y-1">
    <ul class="space-y-1">
      <li
        v-for="rule in rules"
        :key="rule.key"
        class="flex items-center gap-1.5"
        :class="{ 'text-rui-error': invalid && !rule.met }"
        :data-met="rule.met"
      >
        <RuiIcon
          v-if="rule.met"
          name="lu-circle-check"
          size="14"
          class="text-rui-success"
        />
        <RuiIcon
          v-else-if="invalid"
          name="lu-circle-x"
          size="14"
        />
        <RuiIcon
          v-else
          name="lu-circle"
          size="14"
          class="text-rui-grey-400"
        />
        <span>{{ rule.label }}</span>
        <span class="sr-only">
          {{ rule.met ? t('auth.common.password_rules.done') : t('auth.common.password_rules.missing') }}
        </span>
      </li>
    </ul>
    <p>{{ t('auth.common.password_rules.server') }}</p>
    <p
      v-for="error in errorList"
      :key="error"
      class="text-rui-error"
    >
      {{ error }}
    </p>
  </div>
</template>
