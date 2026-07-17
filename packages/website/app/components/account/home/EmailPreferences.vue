<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { get } from '@vueuse/shared';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { useProfileUpdate } from '~/composables/account/use-profile-update';

interface EmailPreferencesFormState {
  newsletterConsent: boolean;
}

const { t } = useI18n({ useScope: 'global' });

const state = reactive<EmailPreferencesFormState>({
  newsletterConsent: false,
});

const {
  $externalResults,
  account,
  done,
  loading,
  updateProfile,
} = useProfileUpdate();

const rules = {
  newsletterConsent: {},
};

const v$ = useVuelidate(rules, state, {
  $autoDirty: true,
  $externalResults,
});

function reset(): void {
  const userAccount = get(account);
  if (!userAccount)
    return;

  state.newsletterConsent = userAccount.newsletterConsent;
  get(v$).$reset();
}

async function update(): Promise<void> {
  await updateProfile(v$, state);
}

onBeforeMount(() => {
  reset();
});
</script>

<template>
  <div class="pt-2">
    <div class="text-h6 mb-2">
      {{ t('email_preferences.title') }}
    </div>
    <p class="text-rui-text-secondary mb-6">
      {{ t('email_preferences.description') }}
    </p>

    <RuiCheckbox
      id="newsletter-consent"
      v-model="state.newsletterConsent"
      color="primary"
      hide-details
    >
      {{ t('email_preferences.newsletter') }}
    </RuiCheckbox>

    <div class="mt-10 mb-5 border-t border-grey-50" />

    <div class="flex justify-end gap-3">
      <RuiButton
        size="lg"
        color="primary"
        variant="outlined"
        @click="reset()"
      >
        {{ t('actions.reset') }}
      </RuiButton>
      <RuiButton
        data-cy="update-email-preferences"
        size="lg"
        :loading="loading"
        color="primary"
        @click="update()"
      >
        {{ t('actions.update') }}
      </RuiButton>
    </div>
  </div>

  <FloatingNotification
    type="success"
    closeable
    :visible="done"
    :timeout="3000"
    @dismiss="done = false"
  >
    {{ t('notifications.changes_saved') }}
  </FloatingNotification>
</template>
