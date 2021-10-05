<template>
  <card :class="$style.info">
    <heading subheading> Customer Information</heading>
    <input-field
      id="github"
      v-model="state.githubUsername"
      :error-messages="v$.githubUsername.$errors"
      hint="Optional. Provide Github username for in-Github support."
      label="Github Username"
    />

    <input-field
      id="first-name"
      v-model="state.firstName"
      :disabled="movedOffline"
      :error-messages="v$.firstName.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="First Name"
    />
    <input-field
      id="last-name"
      v-model="state.lastName"
      :disabled="movedOffline"
      :error-messages="v$.lastName.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Last Name"
    />
    <input-field
      id="company-name"
      v-model="state.companyName"
      :disabled="movedOffline"
      :error-messages="v$.companyName.$errors"
      hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
      label="Company Name"
    />
    <input-field
      id="vat-id"
      v-model="state.vatId"
      :disabled="movedOffline"
      :error-messages="v$.vatId.$errors"
      hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
      label="VAT ID"
    />

    <heading subheading>Address</heading>

    <input-field
      id="address-1"
      v-model="state.address1"
      :disabled="movedOffline"
      :error-messages="v$.address1.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Address line 1"
    />
    <input-field
      id="address-2"
      v-model="state.address2"
      :disabled="movedOffline"
      :error-messages="v$.address2.$errors"
      hint="Optional. Additional data for the address."
      label="Address line 2"
    />
    <input-field
      id="city"
      v-model="state.city"
      :disabled="movedOffline"
      :error-messages="v$.city.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="City"
    />
    <input-field
      id="postal"
      v-model="state.postcode"
      :disabled="movedOffline"
      :error-messages="v$.postcode.$errors"
      hint="Required. Will only be used for invoice of payments."
      label="Postal code"
    />
    <input-field
      id="country"
      v-model="state.country"
      :disabled="movedOffline"
      :error-messages="v$.country.$errors"
      :items="countries"
      hint="Required. Will only be used for invoice of payments."
      label="Country"
      placeholder="Select country"
      type="select"
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
  useStore,
} from '@nuxtjs/composition-api'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { ActionResult, Actions, RootState } from '~/store'
import { loadCountries } from '~/composables/countries'

export default defineComponent({
  name: 'AccountInformation',
  setup() {
    const store = useStore<RootState>()
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

    const movedOffline = computed(
      () => store.state.account?.address.movedOffline ?? false
    )

    onMounted(() => {
      const account = store.state.account
      if (!account) {
        return
      }

      const offline =
        'Moved offline. For editing please contact support@rotki.com.'

      const unavailable = movedOffline.value

      state.githubUsername = account.githubUsername
      state.firstName = unavailable ? offline : account.address.firstName
      state.lastName = unavailable ? offline : account.address.lastName
      state.companyName = unavailable ? offline : account.address.companyName
      state.vatId = unavailable ? offline : account.address.vatId
      state.address1 = unavailable ? offline : account.address.address1
      state.address2 = unavailable ? offline : account.address.address2
      state.city = unavailable ? offline : account.address.city
      state.postcode = unavailable ? offline : account.address.postcode
      state.country = unavailable ? offline : account.address.country
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
      loading.value = true
      const { success, message } = (await store.dispatch(
        Actions.UPDATE_PROFILE,
        state
      )) as ActionResult
      if (success) {
        done.value = true
      } else if (message && typeof message !== 'string') {
        $externalResults.value = message
      }
      loading.value = false
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
