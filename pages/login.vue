<template>
  <div :class="$style.wrapper">
    <div :class="$style.row">
      <div>
        <div :class="$style.header">
          <div :class="$style.title">Rotki</div>
          <div :class="$style.subtitle">Premium account management</div>
        </div>

        <div :class="$style.inputs">
          <div :class="$style.signin">Sign in</div>

          <input type="text" :class="$style.input" />
          <input type="password" :class="$style.input" />

          <div>
            <a href="/forgotpassword">Forgot password</a>
          </div>

          <button :class="$style.button">Sign in</button>
          <div>First time premium?<a href="/signup"> Sign Up here</a></div>
        </div>

        <div>
          Here you can create or login to your premium account. A premium
          account is only needed to unlock the premium features of the
          application and is not the same as the account you use in the Rotki
          application. Credentials for one account can not be used for the
          other.
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  head: () => {
    return {
      title: 'Rotki: Login',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your rotki premium account',
        },
      ],
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    }
  },
})
</script>

<style module>
.wrapper {
  @apply w-screen h-screen flex flex-row align-middle justify-center;
}

.header {
  padding-bottom: 20px;
}

.title {
  @apply font-serif font-bold text-primary;

  font-size: 3.7rem;
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-transform: uppercase;
}

.row {
  @apply flex flex-row;

  max-width: 550px;
  max-height: 550px;
  margin: auto;
}

.input {
  @apply border-shade10 box-border border-solid;

  margin-top: 16px;
  border-width: 1px;
  border-radius: 8px;
  height: 56px;
  width: 336px;
}

.signin {
  @apply font-serif font-bold text-primary2;

  font-size: 32px;
  line-height: 47px;
  letter-spacing: -0.01em;
}

.button {
  @apply text-white bg-primary hover:bg-shade12 font-sans focus:outline-none focus:ring-1 focus:ring-shade12 focus:ring-opacity-75;

  height: 56px;
  width: 336px;
  border-radius: 8px;
}
</style>
