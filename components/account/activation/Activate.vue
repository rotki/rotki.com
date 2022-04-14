<template>
  <page>
    <template #title> Account Activation </template>
    <div :class="$style.content">
      <div v-if="!validating">
        <user-action-message v-if="isValid">
          <template #header>Welcome to rotki</template>

          <p>Your rotki account has been successfully activated.</p>
          <div>
            To see your dashboard click
            <external-link same-tab text="here" url="/home" />
          </div>
        </user-action-message>
        <user-action-message v-else>
          <template #header>Invalid Link</template>
          <p>The activation link is not valid.</p>
          <p>This can happen if you have already confirmed your account.</p>
        </user-action-message>
      </div>
      <div v-else>
        <loader />
      </div>
    </div>
  </page>
</template>

<script lang="ts">
import {
  defineComponent,
  onBeforeMount,
  ref,
  useContext,
  useRoute,
} from '@nuxtjs/composition-api'
import { set } from '@vueuse/core'

function setupTokenValidation() {
  const { $api } = useContext()
  const { value } = useRoute()
  const { uid, token } = value.params
  const validating = ref(true)
  const isValid = ref(false)

  async function validateToken() {
    const response = await $api.get(`/webapi/activate/${uid}/${token}/`, {
      validateStatus: (status) => [200, 404].includes(status),
    })

    if (response.status === 200) {
      set(isValid, true)
    }

    set(validating, false)
  }

  onBeforeMount(async () => await validateToken())
  return { validating, isValid }
}

export default defineComponent({
  name: 'Activate',
  setup() {
    return setupTokenValidation()
  },
})
</script>

<style module lang="scss">
.content {
  @apply flex flex-row justify-center;
}
</style>
