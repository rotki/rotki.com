<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';

const modelValue = defineModel<boolean>({ required: true });

defineProps<{ disabled?: boolean }>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiCheckbox
    id="refund"
    v-model="modelValue"
    :disabled="disabled"
    color="primary"
    hide-details
  >
    <i18n-t
      keypath="policies.refund.accept_policy.text"
      scope="global"
      tag="span"
    >
      <template #action>
        <ButtonLink
          to="/refund-policy"
          color="primary"
          tag="span"
          class="underline"
          :class="$style.link"
          external
          target="_blank"
        >
          {{ t('policies.refund.accept_policy.action') }}
        </ButtonLink>
      </template>
    </i18n-t>
  </RuiCheckbox>
</template>

<style module lang="scss">
.link {
  @apply p-0 #{!important};

  display: unset;

  :global(> span) {
    display: unset !important;
  }
}
</style>
