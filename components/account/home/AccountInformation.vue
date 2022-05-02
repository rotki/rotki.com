<template>
  <card :class="$style.info">
    <heading subheading> Customer Information</heading>
    <input-field
      id="github"
      v-model="state.githubUsername"
      :error-messages="v$.githubUsername.$errors"
      hint="Optional. Provide Github username for in-Github support."
      label="Github Username"
      @blur="v$.githubUsername.$touch()"
    />

    <input-field
      id="first-name"
      v-model="state.firstName"
      :disabled="movedOffline"
      :error-messages="v$.firstName.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="First Name"
      @blur="v$.firstName.$touch()"
    />

    <input-field
      id="last-name"
      v-model="state.lastName"
      :disabled="movedOffline"
      :error-messages="v$.lastName.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Last Name"
      @blur="v$.lastName.$touch()"
    />

    <input-field
      id="company-name"
      v-model="state.companyName"
      :disabled="movedOffline"
      :error-messages="v$.companyName.$errors"
      hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
      label="Company Name"
      @blur="v$.companyName.$touch()"
    />

    <input-field
      id="vat-id"
      v-model="state.vatId"
      :disabled="movedOffline"
      :error-messages="v$.vatId.$errors"
      hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
      label="VAT ID"
      @blur="v$.vatId.$touch()"
    />

    <heading subheading>Address</heading>

    <input-field
      id="address-1"
      v-model="state.address1"
      :disabled="movedOffline"
      :error-messages="v$.address1.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Address line 1"
      @blur="v$.address1.$touch()"
    />

    <input-field
      id="address-2"
      v-model="state.address2"
      :disabled="movedOffline"
      :error-messages="v$.address2.$errors"
      hint="Optional. Additional data for the address."
      label="Address line 2"
      @blur="v$.address2.$touch()"
    />

    <input-field
      id="city"
      v-model="state.city"
      :disabled="movedOffline"
      :error-messages="v$.city.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="City"
      @blur="v$.city.$touch()"
    />

    <input-field
      id="postal"
      v-model="state.postcode"
      :disabled="movedOffline"
      :error-messages="v$.postcode.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Postal code"
      @blur="v$.postcode.$touch()"
    />

    <country-select
      id="country"
      v-model="state.country"
      :countries="countries"
      disabled
      :error-messages="v$.country.$errors"
      hint="Email us at support@rotki.com if you need to change your billing country."
      label="Country"
      @blur="v$.country.$touch()"
    />

    <action-button
      :class="$style.confirm"
      :loading="loading"
      primary
      small
      text="Update"
      @click="update"
    >
      <spinner v-if="loading" class="animate-spin" />
    </action-button>
  </card>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  reactive,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { get, set } from '@vueuse/core'
import { useMainStore } from '~/store'
import { loadCountries } from '~/composables/countries'

export default defineComponent({
  name: 'AccountInformation',
  setup() {
    const store = useMainStore()
    const state = reactive({
      githubUsername: '',
      firstName: '',
      lastName: '',
      companyName: '',
      vatId: '',
      address1: '',
      address2: '',
      city: '',
      postcode: '',
      country: '',
    })

    // pinia#852
    const { account } = toRefs(store)

    const movedOffline = computed(
      () => get(account)?.address.movedOffline ?? false
    )

    onMounted(() => {
      const userAccount = get(account)
      if (!userAccount) {
        return
      }

      const offline =
        'Moved offline. For editing please contact support@rotki.com.'

      const unavailable = get(movedOffline)

      state.githubUsername = userAccount.githubUsername
      state.firstName = unavailable ? offline : userAccount.address.firstName
      state.lastName = unavailable ? offline : userAccount.address.lastName
      state.companyName = unavailable
        ? offline
        : userAccount.address.companyName
      state.vatId = unavailable ? offline : userAccount.address.vatId
      state.address1 = unavailable ? offline : userAccount.address.address1
      state.address2 = unavailable ? offline : userAccount.address.address2
      state.city = unavailable ? offline : userAccount.address.city
      state.postcode = unavailable ? offline : userAccount.address.postcode
      state.country = unavailable ? offline : userAccount.address.country
    })

    const rules = {
      githubUsername: {},
      firstName: { required },
      lastName: { required },
      companyName: {},
      vatId: {},
      address1: { required },
      address2: {},
      city: { required },
      postcode: { required },
      country: { required },
    }
    const $externalResults = ref<Record<string, string[]>>({})
    const v$ = useVuelidate(rules, state, {
      $autoDirty: true,
      $externalResults,
    })

    const loading = ref(false)
    const done = ref(false)
    const update = async () => {
      const isValid = await get(v$).$validate()
      if (!isValid) {
        return
      }
      set(loading, true)
      const { success, message } = await store.updateProfile(state)
      if (success) {
        set(done, true)
      } else if (message && typeof message !== 'string') {
        set($externalResults, message)
      }
      set(loading, false)
    }
    return {
      update,
      loading,
      done,
      movedOffline,
      state,
      v$,
      ...loadCountries(),
    }
  },
})
</script>
<style lang="scss" module>
.info {
  @apply mt-8;
}

.confirm {
  @apply mt-4;
}
</style>
