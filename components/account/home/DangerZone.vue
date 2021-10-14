<template>
  <card warning>
    <heading>Danger Zone</heading>

    <p :class="$style.text">
      Proceeding will completely delete your account data. If you proceed you
      will not be able to recover your account!
    </p>

    <action-button
      primary
      small
      text="Delete My Account"
      warning
      @click="confirm = true"
    />

    <modal-dialog
      v-if="confirm"
      height="400px"
      padding="24px"
      @dismiss="confirm = false"
    >
      <heading>Delete Account</heading>
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
          @click="confirm = true"
        />
      </div>
    </modal-dialog>
  </card>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { computed, ref, useStore } from '@nuxtjs/composition-api'
import { RootState } from '~/store'

export default defineComponent({
  name: 'DangerZone',
  setup() {
    const confirm = ref(false)
    const usernameConfirmation = ref('')
    const store = useStore<RootState>()
    const username = computed(() => {
      return store.state.account?.username
    })
    return {
      confirm,
      username,
      usernameConfirmation,
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
</style>
