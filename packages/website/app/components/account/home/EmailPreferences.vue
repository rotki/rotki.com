<script setup lang="ts">
import { get } from '@vueuse/shared';
import { z } from 'zod';
import AccountSection from '~/components/account/home/AccountSection.vue';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { useProfileUpdate } from '~/composables/account/use-profile-update';
import { useZodForm } from '~/composables/use-zod-form';

interface EmailPreferencesFormState {
  newsletterConsent: boolean;
}

const { t } = useI18n({ useScope: 'global' });

const state = reactive<EmailPreferencesFormState>({
  newsletterConsent: false,
});

const {
  account,
  dismissDone,
  done,
  loading,
  updateProfile,
} = useProfileUpdate();

const form = useZodForm(z.object({ newsletterConsent: z.boolean() }), state);

function reset(): void {
  const userAccount = get(account);
  if (!userAccount)
    return;

  state.newsletterConsent = userAccount.newsletterConsent;
  form.reset();
}

/** Saves as soon as the switch flips, and flips it back when the save fails. */
async function toggle(value: boolean): Promise<void> {
  state.newsletterConsent = value;
  if (!(await updateProfile(form, state)))
    reset();
}

onBeforeMount(() => {
  reset();
});
</script>

<template>
  <AccountSection
    :title="t('email_preferences.title')"
    :description="t('email_preferences.description')"
  >
    <div class="max-w-2xl rounded-lg border border-default p-4 md:p-5">
      <RuiSwitch
        id="newsletter-consent"
        :model-value="state.newsletterConsent"
        :disabled="loading"
        color="primary"
        :label="t('email_preferences.newsletter')"
        :hint="t('email_preferences.newsletter_hint')"
        data-cy="newsletter-consent"
        @update:model-value="toggle($event)"
      />
    </div>
  </AccountSection>

  <FloatingNotification
    type="success"
    closeable
    :visible="done"
    :timeout="3000"
    @dismiss="dismissDone()"
  >
    {{ t('notifications.changes_saved') }}
  </FloatingNotification>
</template>
