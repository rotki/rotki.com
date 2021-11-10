<template>
  <fragment>
    <div :class="$style.inputs">
      <hosted-field
        id="card-number"
        :class="$style.number"
        :empty="empty.number"
        :focused="focused === 'number'"
        :valid="!numberError"
        label="Card Number"
        number
        @click="focus('number')"
      />
      <hosted-field
        id="expiration"
        :class="$style.expiration"
        :empty="empty.expirationDate"
        :focused="focused === 'expirationDate'"
        :valid="!expirationError"
        label="Expiration"
        @click="focus('expirationDate')"
      />
      <hosted-field
        id="cvv"
        :class="$style.cvv"
        :empty="empty.cvv"
        :focused="focused === 'cvv'"
        :valid="!cvvError"
        label="CVV"
        @click="focus('cvv')"
      />
    </div>
    <selected-plan-overview :plan="plan" />
    <div>
      <selection-button
        :class="$style.button"
        :disabled="!valid"
        selected
        @click="submit"
      >
        Start subscription
      </selection-button>
    </div>
    <custom-checkbox id="refund" v-model="accepted">
      <span>
        I have read and agreed to the
        <nuxt-link :class="$style.link" target="_blank" to="/refund-policy">
          Refunds/Cancellation Policy
        </nuxt-link>
      </span>
    </custom-checkbox>
  </fragment>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  Ref,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import braintree, { HostedFields, ThreeDSecure } from 'braintree-web'
import { SelectedPlan } from '~/types'
import { assert } from '~/components/utils/assertions'

type FieldStatus = {
  valid: boolean
  touched: boolean
}

type EmptyState = { number: boolean; cvv: boolean; expirationDate: boolean }

function setupEmptyStateMonitoring(
  hostedFields: HostedFields,
  empty: Ref<EmptyState>
) {
  hostedFields.on('notEmpty', (event) => {
    const field = event.fields[event.emittedBy]
    empty.value = { ...empty.value, [event.emittedBy]: field.isEmpty }
  })

  hostedFields.on('empty', (event) => {
    const field = event.fields[event.emittedBy]
    empty.value = { ...empty.value, [event.emittedBy]: field.isEmpty }
  })
}

function setupValidityMonitoring(
  hostedFields: HostedFields,
  {
    cvvStatus,
    expirationDateStatus,
    numberStatus,
  }: {
    numberStatus: Ref<FieldStatus>
    expirationDateStatus: Ref<FieldStatus>
    cvvStatus: Ref<FieldStatus>
  }
) {
  hostedFields.on('validityChange', (event) => {
    const field = event.emittedBy
    const valid = event.fields[field].isValid
    if (field === 'number') {
      numberStatus.value = { ...numberStatus.value, valid }
    } else if (field === 'expirationDate') {
      expirationDateStatus.value = { ...expirationDateStatus.value, valid }
    } else if (field === 'cvv') {
      cvvStatus.value = { ...cvvStatus.value, valid }
    }
  })
}

function setupFocusManagement(
  hostedFields: HostedFields,
  focused: Ref<string>,
  {
    cvvStatus,
    expirationDateStatus,
    numberStatus,
  }: {
    numberStatus: Ref<FieldStatus>
    expirationDateStatus: Ref<FieldStatus>
    cvvStatus: Ref<FieldStatus>
  }
) {
  hostedFields.on('focus', (event) => {
    const field = event.emittedBy
    focused.value = field
    if (field === 'number') {
      numberStatus.value = { ...numberStatus.value, touched: true }
    } else if (field === 'expirationDate') {
      expirationDateStatus.value = {
        ...expirationDateStatus.value,
        touched: true,
      }
    } else if (field === 'cvv') {
      cvvStatus.value = { ...cvvStatus.value, touched: true }
    }
  })
  hostedFields.on('blur', (event) => {
    if (focused.value === event.emittedBy) {
      focused.value = ''
    }
  })
}

const hasError = (status: Ref<FieldStatus>) =>
  computed(() => {
    const value = status.value
    return value.touched && !value.valid
  })

const setupHostedFields = () => {
  let _fields: HostedFields | null = null

  const get = () => {
    assert(_fields)
    return _fields
  }

  const create = async (client: braintree.Client) => {
    _fields = await braintree.hostedFields.create({
      client,
      styles: {},
      fields: {
        number: {
          selector: '#card-number',
        },
        cvv: {
          selector: '#cvv',
        },
        expirationDate: {
          selector: '#expiration',
        },
      },
    })
  }

  const teardown = () => {
    _fields?.teardown()
  }

  const setup = (
    focused: Ref<string>,
    empty: Ref<EmptyState>,
    status: {
      numberStatus: Ref<FieldStatus>
      expirationDateStatus: Ref<FieldStatus>
      cvvStatus: Ref<FieldStatus>
    }
  ) => {
    setupFocusManagement(get(), focused, status)
    setupEmptyStateMonitoring(get(), empty)
    setupValidityMonitoring(get(), status)
  }
  return {
    create,
    setup,
    get,
    teardown,
  }
}

export default defineComponent({
  name: 'CardPayment',
  props: {
    token: { required: true, type: String },
    plan: { required: true, type: Object as PropType<SelectedPlan> },
  },
  emits: ['pay'],
  setup(props, { emit }) {
    const { token, plan } = toRefs(props)
    const fields = setupHostedFields()

    const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
      fields.get().focus(field)
    }
    const accepted = ref(false)
    const defaultStatus: FieldStatus = {
      valid: false,
      touched: false,
    }
    const numberStatus = ref<FieldStatus>(defaultStatus)
    const expirationDateStatus = ref<FieldStatus>(defaultStatus)
    const cvvStatus = ref<FieldStatus>(defaultStatus)

    const numberError = hasError(numberStatus)
    const expirationError = hasError(expirationDateStatus)
    const cvvError = hasError(cvvStatus)

    const empty = ref({
      number: true,
      cvv: true,
      expirationDate: true,
    })

    const focused = ref('')

    let threeDSecure: ThreeDSecure

    onMounted(async () => {
      const client = await braintree.client.create({
        authorization: token.value,
      })

      await fields.create(client)
      fields.setup(focused, empty, {
        numberStatus,
        expirationDateStatus,
        cvvStatus,
      })

      threeDSecure = await braintree.threeDSecure.create({
        version: 2,
        client,
      })
    })

    onUnmounted(() => {
      fields.teardown()
    })

    const valid = computed(
      () =>
        accepted.value &&
        numberStatus.value.valid &&
        expirationDateStatus.value.valid &&
        cvvStatus.value.valid
    )

    const submit = async () => {
      const selectedPlan = plan.value
      const token = await fields.get().tokenize()
      await threeDSecure.verifyCard({
        amount: parseFloat(selectedPlan.finalPriceInEur),
        nonce: token.nonce,
        bin: token.details.bin,
      })
      emit('pay', {
        months: plan.value.months,
        nonce: token.nonce,
      })
    }

    return {
      empty,
      numberError,
      expirationError,
      cvvError,
      accepted,
      focused,
      valid,
      focus,
      submit,
    }
  },
})
</script>

<style lang="scss" module>
.inputs {
  @apply flex flex-row;

  & > *:not(:first-child) {
    margin-left: 32px;
  }
}

.number {
  width: 328px;
}

.cvv,
.expiration {
  width: 128px;
}

.link {
  @apply text-primary3;
}

.button {
  margin-top: 51px;
}
</style>
