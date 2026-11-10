<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

const { step, username, email } = defineProps<{
  step: number;
  username: string;
  email: string;
}>();

const emit = defineEmits<{
  edit: [];
}>();

const { t } = useI18n({ useScope: 'global' });

/** The panel's heading for the current step: the account explanation, then why invoice details are needed. */
const header = computed<{ eyebrow: string; title: string; description: string }>(() => step === 1
  ? {
      description: t('auth.signup.aside.account.description'),
      eyebrow: t('auth.signup.aside.account.eyebrow'),
      title: t('auth.signup.aside.account.title'),
    }
  : {
      description: t('auth.signup.aside.invoice.description'),
      eyebrow: t('auth.signup.aside.invoice.eyebrow'),
      title: t('auth.signup.aside.invoice.title'),
    });

const points = computed<{ icon: RuiIcons; title: string; text: string }[]>(() => [{
  icon: 'lu-shield',
  text: t('auth.signup.aside.account.separate.text'),
  title: t('auth.signup.aside.account.separate.title'),
}, {
  icon: 'lu-credit-card',
  text: t('auth.signup.aside.account.pay.text'),
  title: t('auth.signup.aside.account.pay.title'),
}, {
  icon: 'lu-clock',
  text: t('auth.signup.aside.account.cancel.text'),
  title: t('auth.signup.aside.account.cancel.title'),
}]);
</script>

<template>
  <aside class="rounded-2xl border border-default bg-white p-8 xl:p-10">
    <p class="text-overline font-semibold text-rui-primary mb-3">
      {{ header.eyebrow }}
    </p>
    <h2 class="text-h5 font-bold text-rui-text text-pretty mb-4">
      {{ header.title }}
    </h2>
    <p class="text-body-1 text-rui-text-secondary text-pretty mb-8">
      {{ header.description }}
    </p>

    <template v-if="step === 1">
      <ul
        class="space-y-5 mb-8"
        data-cy="signup-aside"
      >
        <li
          v-for="point in points"
          :key="point.icon"
          class="flex gap-3.5"
        >
          <span class="size-9 rounded-lg bg-rui-grey-100 flex items-center justify-center shrink-0">
            <RuiIcon
              :name="point.icon"
              size="20"
              class="text-rui-primary"
            />
          </span>
          <span class="text-body-2">
            <strong class="block text-rui-text font-medium">{{ point.title }}</strong>
            <span class="text-rui-text-secondary">{{ point.text }}</span>
          </span>
        </li>
      </ul>
      <p class="text-body-2 text-rui-text-secondary">
        {{ t('auth.signup.aside.account.download') }}
        <NuxtLink
          to="/download"
          class="font-medium text-rui-primary hover:underline"
        >
          {{ t('auth.signup.aside.account.download_link') }}
        </NuxtLink>
      </p>
    </template>

    <div
      v-else
      class="flex items-center gap-3.5 rounded-xl bg-rui-grey-50 px-5 py-4"
    >
      <span class="size-10 rounded-full bg-rui-grey-100 text-rui-primary font-bold flex items-center justify-center uppercase shrink-0">
        {{ username.charAt(0) }}
      </span>
      <div class="min-w-0 grow">
        <p class="text-caption text-rui-text-secondary">
          {{ t('auth.signup.aside.invoice.signing_up_as') }}
        </p>
        <p class="text-body-2 font-medium text-rui-text truncate">
          {{ username }}
        </p>
        <p class="text-body-2 text-rui-text-secondary truncate">
          {{ email }}
        </p>
      </div>
      <RuiButton
        variant="text"
        color="primary"
        size="sm"
        @click="emit('edit')"
      >
        {{ t('auth.signup.aside.invoice.edit') }}
      </RuiButton>
    </div>
  </aside>
</template>
