<template>
  <square-form>
    <template #subtitle> Reset your password </template>
    <input-field id="email" v-model="email" label="Email" />
    <recaptcha :class="$style.recaptcha" />
    <action-button primary text="Submit" :class="$style.button" />
  </square-form>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'PasswordForm',
  data() {
    return {
      email: '',
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply w-screen h-screen flex flex-col;

  @include for-size(phone-only) {
    padding: $mobile-margin / 2;
  }
}

.content {
  @apply flex flex-row items-center justify-center;

  height: 100%;
}

.inputs {
  max-width: 500px;
  height: 500px;

  @media only screen and (max-height: 800px) {
    margin-top: 48px;
  }
}

.button {
  margin-top: 48px;
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-align: center;
  text-transform: uppercase;
}

.recaptcha {
  margin-top: 16px;
}
</style>
