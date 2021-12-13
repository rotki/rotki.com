<template>
  <card warning>
    <heading>Danger Zone</heading>

    <p :class="$style.text">
      Proceeding will completely delete your account data. If you proceed you
      will not be able to recover your account!
    </p>

    <p v-if="isSubscriber" :class="$style.warning">
      You cannot delete your account while you have an active subscription.
    </p>

    <action-button
      :disabled="isSubscriber"
      primary
      small
      text="Delete My Account"
      warning
      @click="confirm = true"
    />

    <modal-dialog v-model="confirm" padding="1rem">
      <div :class="$style.title">Delete Account</div>
      <p :class="$style.description">
        By proceeding you will delete your account and all its accompanying data
        from our servers. This action is not reversible. Are you sure you want
        to perform the deletion?
      </p>

      <p>
        Type your username to continue:
        <span :class="$style.username">{{ username }}</span>
      </p>
      <input-field id="user-confirm" v-model="usernameConfirmation" />

      <div :class="$style.buttons">
        <action-button filled small text="Cancel" @click="confirm = false" />
        <action-button
          :disabled="username !== usernameConfirmation"
          primary
          small
          text="Confirm"
          warning
          @click="deleteAccount"
        />
      </div>
    </modal-dialog>
    <transition name="fade">
      <notification-message v-if="error">
        <div>
          <error-icon />
        </div>
        <div :class="$style.errorText">
          <div :class="$style.errorTitle">Account deletion failed</div>
          <div :class="$style.errorDescription">{{ error }}</div>
        </div>
      </notification-message>
    </transition>
  </card>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  useRouter,
} from '@nuxtjs/composition-api'
import { storeToRefs } from 'pinia'
import { ActionResult, useMainStore } from '~/store'

export default defineComponent({
  name: 'DangerZone',
  setup() {
    const confirm = ref(false)
    const usernameConfirmation = ref('')
    const error = ref('')

    const store = useMainStore()
    const router = useRouter()
    const { account } = storeToRefs(store)

    const username = computed(() => account.value?.username)
    const isSubscriber = computed(
      () => account.value?.hasActiveSubscription ?? false
    )

    const deleteAccount = async () => {
      confirm.value = false
      const result: ActionResult = await store.deleteAccount({
        username: usernameConfirmation.value,
      })
      if (result.success) {
        router.push('/login')
      } else {
        error.value = typeof result.message === 'string' ? result.message : ''
        setTimeout(() => (error.value = ''), 4500)
      }
    }

    return {
      confirm,
      error,
      username,
      usernameConfirmation,
      isSubscriber,
      deleteAccount,
    }
  },
})
</script>

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
}

.warning {
  @apply mb-2 text-shade11 font-bold;
}

.errorText {
  @apply ml-2;
}

.errorTitle {
  @apply font-sans font-bold;
}

.errorDescription {
  @apply font-sans text-shade11;
}

.title {
  @apply font-sans text-primary2 font-bold text-xl;
}
</style>
