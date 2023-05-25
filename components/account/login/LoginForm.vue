<script setup lang="ts">
import { useMainStore } from '~/store';

const props = withDefaults(defineProps<{ modal?: boolean }>(), {
  modal: false,
});

const emit = defineEmits<{ (e: 'complete'): void }>();

const { modal } = toRefs(props);
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');

const valid = computed(() => !!unref(username) && !!unref(password));

const { login } = useMainStore();

const performLogin = async () => {
  error.value = await login({
    username: username.value,
    password: password.value,
  });

  if (!error.value) {
    if (modal.value) {
      emit('complete');
    } else {
      await navigateTo('/home');
    }
  }
};

const css = useCssModule();
</script>

<template>
  <BoxContainer>
    <template #label>Sign in</template>
    <InputField
      id="username"
      v-model="username"
      filled
      label="Username"
      type="text"
      autocomplete="username"
      @focus="error = ''"
    >
      <template #prepend>
        <span :class="css.prepend">
          <UserIcon />
        </span>
      </template>
    </InputField>
    <InputField
      id="password"
      v-model="password"
      :class="css.password"
      :type="showPassword ? 'text' : 'password'"
      filled
      autocomplete="current-password"
      label="Password"
      @enter="performLogin()"
      @focus="error = ''"
    >
      <template #prepend>
        <span :class="css.prepend">
          <PasswordIcon />
        </span>
      </template>
      <template #append>
        <button :class="css.show" @click="showPassword = !showPassword">
          <span v-if="showPassword">HIDE</span>
          <span v-else>SHOW</span>
        </button>
      </template>
    </InputField>

    <div :class="css.errorWrapper">
      <div v-if="error" :class="css.error">{{ error }}</div>
    </div>

    <div :class="css.buttonContainer">
      <ActionButton
        :class="css.button"
        :disabled="!valid"
        primary
        small
        text="Sign in"
        @click="performLogin()"
      />
    </div>

    <div :class="css.reset">
      <ExternalLink same-tab text="Forgot password?" url="/password/recover" />
    </div>

    <div :class="css.divider" />

    <div :class="css.create">
      First time premium?
      <ExternalLink
        :class="css.signup"
        same-tab
        text="Sign up now"
        url="/signup"
      />
    </div>
  </BoxContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.buttonContainer {
  @apply flex flex-row align-middle justify-center mt-8;
}

.button {
  width: 288px;
}

.reset {
  @apply flex flex-row justify-center text-primary focus:text-yellow-800 my-6;

  width: 100%;

  @include for-size(phone-only) {
    margin-top: calc($mobile-margin / 2);
    margin-bottom: calc($mobile-margin / 2);
  }
}

.prepend {
  @apply p-3 flex items-center;
}

.password {
  @apply mt-5;
}

.show {
  @apply m-2 focus:outline-none;

  width: 56px;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0;
  color: #363f41;
}

.divider {
  @apply border border-solid border-typography opacity-20;

  width: 328px;
}

.create {
  @apply flex flex-row align-middle justify-center mt-6 mb-2;
}

.signup {
  @apply font-bold ml-2;
}

.error {
  @apply text-error text-xs tracking-tight;
}

.errorWrapper {
  @apply flex flex-row justify-center -mt-1.5;

  height: 18px;
}
</style>
