<template>
  <fragment>
    <error-display v-if="error" :message="error.message" :title="error.title">
      <div :class="$style.close">
        <selection-button :selected="false" @click="close">
          OK
        </selection-button>
      </div>
    </error-display>
    <div v-show="!error">
      <div v-show="!verify">
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
            :disabled="!valid || paying"
            selected
            @click="submit"
          >
            Start subscription
          </selection-button>
        </div>
        <accept-refund-policy v-model="accepted" />
      </div>
      <loader v-if="verify && !challengeVisible" :class="$style.loader" />
    </div>
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
import { ThreeDSecureVerifyOptions } from 'braintree-web/modules/three-d-secure'
import { get, set } from '@vueuse/core'
import { SelectedPlan } from '~/types'
import { logger } from '~/utils/logger'
import { assert } from '~/utils/assert'

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
    set(empty, { ...get(empty), [event.emittedBy]: field.isEmpty })
  })

  hostedFields.on('empty', (event) => {
    const field = event.fields[event.emittedBy]
    set(empty, { ...get(empty), [event.emittedBy]: field.isEmpty })
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
      set(numberStatus, { ...get(numberStatus), valid })
    } else if (field === 'expirationDate') {
      set(expirationDateStatus, { ...get(expirationDateStatus), valid })
    } else if (field === 'cvv') {
      set(cvvStatus, { ...get(cvvStatus), valid })
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
    set(focused, field)
    if (field === 'number') {
      set(numberStatus, { ...get(numberStatus), touched: true })
    } else if (field === 'expirationDate') {
      set(expirationDateStatus, {
        ...get(expirationDateStatus),
        touched: true,
      })
    } else if (field === 'cvv') {
      set(cvvStatus, { ...get(cvvStatus), touched: true })
    }
  })
  hostedFields.on('blur', (event) => {
    if (get(focused) === event.emittedBy) {
      set(focused, '')
    }
  })
}

const hasError = (status: Ref<FieldStatus>) =>
  computed(() => {
    const { touched, valid } = get(status)
    return touched && !valid
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

  const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
    _fields?.focus(field)
  }

  return {
    create,
    setup,
    get,
    focus,
    teardown,
  }
}

type ErrorMessage = {
  title: string
  message: string
}

export default defineComponent({
  name: 'CardPayment',
  props: {
    token: { required: true, type: String },
    plan: { required: true, type: Object as PropType<SelectedPlan> },
  },
  emits: ['pay', 'update:payment'],
  setup(props, { emit }) {
    const { token, plan } = toRefs(props)
    const fields = setupHostedFields()
    const verify = ref(false)
    const challengeVisible = ref(false)

    const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
      fields.focus(field)
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
    const error = ref<ErrorMessage | null>(null)

    let threeDSecure: ThreeDSecure

    onMounted(async () => {
      try {
        const client = await braintree.client.create({
          authorization: get(token),
        })

        await fields.create(client)
        fields.setup(focused, empty, {
          numberStatus,
          expirationDateStatus,
          cvvStatus,
        })

        threeDSecure = await braintree.threeDSecure.create({
          version: '2',
          client,
        })
      } catch (e: any) {
        set(error, {
          title: 'Initialization Error',
          message: e.message,
        })
      }
    })

    onUnmounted(() => {
      threeDSecure?.teardown()
      fields.teardown()
    })

    const valid = computed(
      () =>
        get(accepted) &&
        get(numberStatus).valid &&
        get(expirationDateStatus).valid &&
        get(cvvStatus).valid
    )
    const paying = ref(false)

    const updatePending = () => {
      emit('update:pending', true)
    }

    const submit = async () => {
      set(paying, true)

      const onClose = () => set(challengeVisible, false)
      const onRender = () => set(challengeVisible, true)

      try {
        const selectedPlan = get(plan)
        const token = await fields.get().tokenize()

        const options: ThreeDSecureVerifyOptions = {
          // @ts-ignore
          onLookupComplete(_: any, next: any) {
            next()
          },
          removeFrame: () => updatePending(),
          amount: parseFloat(selectedPlan.finalPriceInEur),
          nonce: token.nonce,
          bin: token.details.bin,
        }
        set(verify, true)

        threeDSecure.on('authentication-modal-close', onClose)
        threeDSecure.on('authentication-modal-render', onRender)

        const payload = await threeDSecure.verifyCard(options)
        set(challengeVisible, false)

        const threeDSecureInfo = payload.threeDSecureInfo
        if (threeDSecureInfo.liabilityShifted) {
          emit('pay', {
            months: get(plan).months,
            nonce: payload.nonce,
          })
        } else {
          const status = (threeDSecureInfo as any)?.status as string | undefined
          set(error, {
            title: '3D Secure authentication failed',
            message: `The 3D Secure authentication of your card failed (${status?.replaceAll(
              '_',
              ' '
            )}). Please try a different payment method.`,
          })
          logger.error(`liability did not shift, due to status: ${status}`)
        }
      } catch (e: any) {
        set(error, {
          title: 'Payment Error',
          message: e.message,
        })
        logger.error(e)
      } finally {
        set(paying, false)
        set(verify, false)
        set(challengeVisible, false)
        threeDSecure.off('authentication-modal-close', onClose)
        threeDSecure.off('authentication-modal-render', onRender)
      }
    }
    const close = () => {
      set(error, null)
    }

    return {
      paying,
      empty,
      numberError,
      expirationError,
      cvvError,
      accepted,
      focused,
      valid,
      verify,
      challengeVisible,
      error,
      close,
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

.button {
  margin-top: 51px;
}

.close {
  @apply flex flex-row justify-center mt-4;
}

.loader {
  min-height: 400px;
}
</style>
