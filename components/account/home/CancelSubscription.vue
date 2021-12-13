<template>
  <div>
    <button :class="$style.actionButton" @click="confirm = true">Cancel</button>
    <modal-dialog v-model="confirm" padding="1rem">
      <div :class="$style.body">
        <h2 :class="$style.title">Canceling Your Rotki Subscription</h2>
        <p :class="$style.text">
          Are you sure you want to cancel your currently running subscription?
          Here are some reasons to make you stay with us:
        </p>
        <ul
          :class="{
            [$style.text]: true,
            [$style.list]: true,
          }"
        >
          <li>
            Rotki is open-source software and your subscription really helps
            towards its development.
          </li>
          <li>
            Did you know that as a premium user by providing your Github
            username you have priority for all issues reported in our
            <external-link
              no-ref
              text="bug tracker"
              url="https://github.com/rotki/rotki/issues"
            />
            ? The same applies to any feature requests.
          </li>
          <li>
            After your canceled subscription expires you will no longer be able
            to use any Rotki premium features
          </li>
          <li>
            A lot more premium features are in development and will soon be
            released to our premium subscribers
          </li>
        </ul>

        <h2 :class="$style.title">Subscription</h2>

        <p v-if="isPending" :class="$style.text">
          Your pending subscription which was created on
          {{ subscription.createdDate }} will never be billed if you cancel. We
          are sad to see you go. Are you sure you want to cancel the
          subscription?
        </p>
        <p v-else :class="$style.text">
          Your subscription which was created on
          {{ subscription.createdDate }} will run until
          {{ subscription.nextActionDate }}
          if you cancel. Until then you will be able to fully utilize the Rotki
          premium features. We are sad to see you go. Are you sure you want to
          cancel the subscription?
        </p>

        <div :class="$style.buttons">
          <action-button
            filled
            small
            text="No don't cancel"
            @click="confirm = false"
          />
          <action-button
            primary
            small
            text="Yes, cancel my subscription"
            warning
            @click="cancelSubscription"
          />
        </div>
      </div>
    </modal-dialog>
  </div>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import { Subscription } from '~/types'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'CancelSubscription',
  props: {
    subscription: {
      required: true,
      type: Object as PropType<Subscription>,
    },
  },
  setup(props) {
    const { subscription } = toRefs(props)
    const isPending = computed(() => subscription.value.status === 'Pending')
    const confirm = ref(false)
    const store = useMainStore()
    const cancelSubscription = async () => {
      confirm.value = false
      await store.cancelSubscription(subscription.value)
    }
    return {
      cancelSubscription,
      isPending,
      confirm,
    }
  },
})
</script>
<style lang="scss" module>
@import '~assets/css/media';

.actionButton {
  @apply text-primary hover:text-yellow-500 focus:outline-none;
}

.title {
  @apply font-sans text-primary2 font-bold text-xl;
}

.text {
  @apply font-sans text-primary2 whitespace-normal mt-4;

  @include text-size(16px, 24px);
}

.list {
  @apply list-disc pl-6 mb-1;
}

.body {
  @apply text-left;
}

.buttons {
  @apply flex flex-row mt-4 justify-end;
}
</style>
