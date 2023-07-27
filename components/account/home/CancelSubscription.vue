<script setup lang="ts">
import { type Subscription } from '~/types';
import { useMainStore } from '~/store';

const props = defineProps<{
  subscription: Subscription;
}>();

const { subscription } = toRefs(props);
const isPending = computed(() => subscription.value.status === 'Pending');
const confirm = ref(false);
const store = useMainStore();
const cancelSubscription = async () => {
  confirm.value = false;
  await store.cancelSubscription(subscription.value);
};

const css = useCssModule();
</script>

<template>
  <div>
    <button :class="css.actionButton" @click="confirm = true">Cancel</button>
    <ModalDialog v-model="confirm" padding="1rem">
      <div :class="css.body">
        <h2 :class="css.title">Canceling Your Rotki Subscription</h2>
        <p :class="css.text">
          Are you sure you want to cancel your currently running subscription?
          Here are some reasons to make you stay with us:
        </p>
        <ul
          :class="{
            [css.text]: true,
            [css.list]: true,
          }"
        >
          <li>
            Rotki is open-source software and your subscription really helps
            towards its development.
          </li>
          <li>
            Did you know that as a premium user by providing your Github
            username you have priority for all issues reported in our
            <ButtonLink
              inline
              color="primary"
              external
              to="https://github.com/rotki/rotki/issues"
            >
              bug tracker
            </ButtonLink>
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

        <h2 :class="css.title">Subscription</h2>

        <p v-if="isPending" :class="css.text">
          Your pending subscription which was created on
          {{ subscription.createdDate }} will never be billed if you cancel. We
          are sad to see you go. Are you sure you want to cancel the
          subscription?
        </p>
        <p v-else :class="css.text">
          Your subscription which was created on
          {{ subscription.createdDate }} will run until
          {{ subscription.nextActionDate }}
          if you cancel. Until then you will be able to fully utilize the Rotki
          premium features. We are sad to see you go. Are you sure you want to
          cancel the subscription?
        </p>

        <div :class="css.buttons">
          <RuiButton
            variant="default"
            size="lg"
            class="uppercase"
            rounded
            color="primary"
            @click="confirm = false"
          >
            No don't cancel
          </RuiButton>

          <RuiButton
            variant="outlined"
            size="lg"
            class="uppercase outline-2"
            rounded
            color="warning"
            @click="cancelSubscription()"
          >
            Yes, cancel my subscription
          </RuiButton>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';

.actionButton {
  @apply text-rui-primary hover:text-yellow-500 focus:outline-none;
}

.title {
  @apply text-rui-text font-bold text-xl;
}

.text {
  @apply text-rui-text whitespace-normal mt-4;

  @include text-size(16px, 24px);
}

.list {
  @apply list-disc pl-6 mb-1;
}

.body {
  @apply text-left;
}

.buttons {
  @apply flex flex-row mt-4 justify-end space-x-2;
}
</style>
