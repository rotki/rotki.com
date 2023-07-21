<script setup lang="ts">
import { RuiButton } from '@rotki/ui-library';
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
      <RuiButton
        :disabled="!valid"
        variant="default"
        size="lg"
        class="w-full"
        color="primary"
        @click="performLogin()"
      >
        Sign in
      </RuiButton>
    </div>

    <div :class="css.reset">
      <ButtonLink to="/password/recover" color="primary">
        Forgot password?
      </ButtonLink>
    </div>

    <div :class="css.divider" />

    <div :class="css.create">
      First time premium?
      <ButtonLink to="/signup" inline color="primary"> Sign up now </ButtonLink>
    </div>
  </BoxContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.buttonContainer {
  @apply flex flex-row align-middle justify-center mt-8;
}

.reset {
  @apply flex flex-row justify-center text-rui-primary focus:text-yellow-800 my-6;

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
  @apply border border-solid border-rui-text opacity-20;

  width: 328px;
}

.create {
  @apply flex flex-row align-middle justify-center mt-6 mb-2;
}

.signup {
  @apply font-bold ml-2;
}

.error {
  @apply text-rui-error text-xs tracking-tight;
}

.errorWrapper {
  @apply flex flex-row justify-center -mt-1.5;

  height: 18px;
}
</style>
