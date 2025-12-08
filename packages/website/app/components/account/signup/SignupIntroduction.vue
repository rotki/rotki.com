<script lang="ts" setup>
import ButtonLink from '~/components/common/ButtonLink.vue';

const emit = defineEmits<{
  next: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="text-center space-y-3 grow">
    <div class="text-h4">
      {{ t('auth.signup.introduction.title') }}
    </div>
    <div class="text-body-1 text-rui-text-secondary whitespace-pre-line">
      <i18n-t
        keypath="auth.signup.introduction.message.default"
        scope="global"
      >
        <template #premium_subscription>
          <strong>
            {{ t('auth.signup.introduction.message.premium_subscription') }}
          </strong>
        </template>
        <template #download>
          <ButtonLink
            to="/download"
            inline
            color="primary"
            class="underline"
          >
            {{ t('auth.signup.introduction.message.download') }}
          </ButtonLink>
        </template>
      </i18n-t>
    </div>
  </div>
  <div class="mt-16">
    <RuiButton
      color="primary"
      class="w-full"
      size="lg"
      data-cy="next-button"
      @click="emit('next')"
    >
      {{ t('actions.continue') }}
    </RuiButton>
  </div>
</template>
