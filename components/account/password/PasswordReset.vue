<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { minLength, required, sameAs } from '@vuelidate/validators';
import { set } from '@vueuse/core';
import { type Ref } from 'vue';
import { FetchError } from 'ofetch';
import { fetchWithCsrf } from '~/utils/api';

function setupTokenValidation() {
  const route = useRoute();
  const { uid, token } = route.params;
  const validating = ref(true);
  const isValid = ref(true);

  const validateToken = async () => {
    try {
      await fetchWithCsrf('/webapi/password-reset/validate/', {
        body: {
          uid,
          token,
        },
      });
    } catch {
      set(isValid, false);
    }

    set(validating, false);
  };

  onMounted(async () => await validateToken());
  return { validating, isValid };
}

function setupFormValidation(
  password: Ref<string>,
  passwordConfirmation: Ref<string>,
  $externalResults: Ref<{}>
) {
  const rules = {
    password: { required, minLength: minLength(8) },
    passwordConfirmation: {
      required,
      sameAsPassword: sameAs(password, 'password'),
    },
  };

  const v$ = useVuelidate(
    rules,
    { password, passwordConfirmation },
    {
      $autoDirty: true,
      $externalResults,
    }
  );

  const valid = computed(() => !v$.value.$invalid);
  return { v$, valid };
}

const password = ref('');
const passwordConfirmation = ref('');
const $externalResults = ref({});

const route = useRoute();
const { uid, token } = route.params;
const submit = async () => {
  try {
    await fetchWithCsrf('/webapi/password-reset/confirm/', {
      body: {
        uid,
        token,
        password: password.value,
        password_confirmation: passwordConfirmation.value,
      },
    });
    await navigateTo({
      path: '/password/changed',
    });
  } catch (e: any) {
    if (e instanceof FetchError) {
      const status = e.status ?? -1;
      if (status === 404) {
        await navigateTo({
          path: '/password/invalid-link',
        });
      } else if (status === 400) {
        const message = e.data.message;
        if (message && typeof message === 'object') {
          $externalResults.value = {
            password: message.password,
            passwordConfirmation: message.password_confirmation,
          };
        }
      }
    }
  }
};

const { validating, isValid } = setupTokenValidation();
const { valid, v$ } = setupFormValidation(
  password,
  passwordConfirmation,
  $externalResults
);

const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Reset your password </template>

    <div :class="css.content">
      <LoadingIndicator v-if="validating" />
      <UserActionMessage v-else-if="!isValid">
        <template #header>Invalid password reset link.</template>
        <p>
          The link you followed doesn't seem like a valid password reset link.
        </p>
      </UserActionMessage>
      <BoxContainer v-else>
        <template #label> Provide your new password </template>
        <InputField
          id="password"
          v-model="password"
          :error-messages="v$.password.$errors"
          filled
          label="Password"
          type="password"
        >
          <ul :class="css.list">
            <li>
              Your password can't be too similar to your other personal
              information.
            </li>
            <li>Your password must contain at least 8 characters.</li>
            <li>Your password can't be a commonly used password.</li>

            <li>Your password can't be entirely numeric.</li>
          </ul>
        </InputField>

        <InputField
          id="password-confirmation"
          v-model="passwordConfirmation"
          :class="css.confirmation"
          :error-messages="v$.passwordConfirmation.$errors"
          filled
          hint="Enter the same password as before, for verification."
          label="Password Confirmation"
          type="password"
        />
        <div :class="css.buttonWrapper">
          <ActionButton
            :class="css.button"
            :disabled="!valid"
            primary
            small
            text="Submit"
            @click="submit"
          />
        </div>
      </BoxContainer>
    </div>
  </PageContainer>
</template>

<style lang="scss" module>
.button {
  @apply mt-16;
}

.buttonWrapper {
  @apply flex flex-row align-middle justify-center;
}

.subtitle {
  @apply font-sans text-primary2 font-medium text-center uppercase text-xs;
}

.list {
  @apply text-xs list-disc pl-6 text-shade8;
}

.box {
  @apply border p-6 rounded w-full lg:w-96;
}

.label {
  @apply text-shade11 font-serif mb-4 text-lg;
}

.confirmation {
  @apply mt-2;
}

.content {
  @apply flex flex-row justify-center;
}
</style>
