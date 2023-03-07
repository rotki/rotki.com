<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { type ActionResult } from '~/types/common';

const confirm = ref(false);
const usernameConfirmation = ref('');
const error = ref('');

const store = useMainStore();
const { account } = storeToRefs(store);

const username = computed(() => account.value?.username);
const isSubscriber = computed(
  () => account.value?.hasActiveSubscription ?? false
);

const deleteAccount = async () => {
  confirm.value = false;
  const result: ActionResult = await store.deleteAccount({
    username: usernameConfirmation.value,
  });
  if (result.success) {
    await store.logout();
    await navigateTo('/account-deleted');
  } else {
    error.value = typeof result.message === 'string' ? result.message : '';
    setTimeout(() => (error.value = ''), 4500);
  }
};

const css = useCssModule();
</script>

<template>
  <CardContainer warning>
    <TextHeading>Danger Zone</TextHeading>

    <p :class="css.text">
      Proceeding will completely delete your account data. If you proceed you
      will not be able to recover your account!
    </p>

    <p v-if="isSubscriber" :class="css.warning">
      You cannot delete your account while you have an active subscription.
    </p>

    <ActionButton
      :disabled="isSubscriber"
      primary
      small
      text="Delete My Account"
      warning
      @click="confirm = true"
    />

    <ModalDialog v-model="confirm" padding="1rem">
      <div :class="css.title">Delete Account</div>
      <p :class="css.description">
        By proceeding you will delete your account and all its accompanying data
        from our servers. This action is not reversible. Are you sure you want
        to perform the deletion?
      </p>

      <p>
        Type your username to continue:
        <span :class="css.username">{{ username }}</span>
      </p>
      <InputField id="user-confirm" v-model="usernameConfirmation" />

      <div :class="css.buttons">
        <ActionButton filled small text="Cancel" @click="confirm = false" />
        <ActionButton
          :disabled="username !== usernameConfirmation"
          primary
          small
          text="Confirm"
          warning
          @click="deleteAccount"
        />
      </div>
    </ModalDialog>
    <ErrorNotification :visible="!!error">
      <template #title> Account deletion failed </template>
      <template #description>{{ error }}</template>
    </ErrorNotification>
  </CardContainer>
</template>

<style lang="scss" module>
.text {
  @apply mt-4 mb-2;
}

.username {
  @apply font-bold;
}

.description {
  @apply mt-4 mb-2;
}

.buttons {
  @apply flex flex-row mt-4 justify-end;

  button:first-child {
    @apply mr-2;
  }
}

.warning {
  @apply mb-2 text-shade11 font-bold;
}

.title {
  @apply font-sans text-primary2 font-bold text-xl;
}
</style>
