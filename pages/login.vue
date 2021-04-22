<template>
  <fragment>
    <div :class="$style.wrapper">
      <div :class="$style.row">
        <div>
          <div :class="$style.header">
            <div :class="$style.title">Rotki</div>
            <div :class="$style.subtitle">Premium account management</div>
          </div>

          <div :class="$style.inputs">
            <div :class="$style.signin">Sign in</div>

            <input
              v-model="username"
              type="text"
              :class="$style.input"
              placeholder="Username"
            />
            <input
              v-model="password"
              type="password"
              :class="$style.input"
              placeholder="Password"
            />

            <div :class="$style.reset">
              <a href="/forgotpassword">Forgot password</a>
            </div>

            <button :class="$style.button">Sign in</button>
            <div :class="$style.create">
              First time premium?<a href="/signup" :class="$style.signup">
                Sign Up here</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.hint">
      <div>
        Here you can create or login to your premium account. A premium account
        is only needed to unlock the premium features of the application and is
        not the same as the account you use in the Rotki application.
        Credentials for one account can not be used for the other.
      </div>
    </div>
  </fragment>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      username: '',
      password: '',
    }
  },
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

  max-width: 340px;
  max-height: 340px;
  margin: auto;
}

.input {
  @apply border-shade10 box-border border-solid focus:border-shade11 py-2 px-3 appearance-none;

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

.reset {
  @apply flex flex-row justify-end text-primary focus:text-yellow-800;

  margin-top: 24px;
  margin-bottom: 24px;
}

.signup {
  @apply text-primary focus:text-yellow-800;
}

.create {
  padding-top: 16px;
}

.hint {
  position: absolute;
  font-size: 14px;
  line-height: 21px;
  align-items: center;
  text-align: center;
  color: #808080;
  bottom: 40px;
  width: 100%;

  div {
    margin-left: auto;
    margin-right: auto;
    max-width: 500px;
  }
}
</style>
