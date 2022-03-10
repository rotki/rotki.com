<template>
  <page>
    <template #title> Account Activation </template>
    <div v-if="!validating">
      <account-activated v-if="isValid" />
      <invalid-activation-code v-else />
    </div>
    <div v-else>
      <loader />
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

function setupTokenValidation() {
  const { $api } = useContext()
  const { value } = useRoute()
  const { uid, token } = value.params
  const validating = ref(false)
  const isValid = ref(false)

  async function validateToken() {
    validating.value = true
    const response = await $api.get(`/webapi/activate/${uid}/${token}/`, {
      validateStatus: (status) => [200, 404].includes(status),
    })

    if (response.status === 200) {
      isValid.value = true
    }

    validating.value = false
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
