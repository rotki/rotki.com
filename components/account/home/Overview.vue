<template>
  <page wide>
    <template #title> Account Management</template>
    <template #links>
      <link-text>
        <span @click="logout">Logout</span>
      </link-text>
    </template>
    <heading> Welcome {{ username }}</heading>
    <subscriptions :class="$style.category" />
    <payments :class="$style.category" />
    <api-keys v-if="premium" :class="$style.category" />
    <account-details :class="$style.category" />
    <danger-zone :class="$style.category" />
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  useRouter,
  useStore,
} from '@nuxtjs/composition-api'
import { Actions, RootState } from '~/store'

export default defineComponent({
  name: 'Overview',
  setup() {
    const store = useStore<RootState>()
    const premium = computed(() => {
      return store.state.account?.canUsePremium ?? false
    })
    const username = computed(() => {
      return store.state.account?.username
    })

    const router = useRouter()
    const logout = async () => {
      await store.dispatch(Actions.LOGOUT)
      router.push('/login')
    }
    return {
      username,
      premium,
      logout,
    }
  },
})
</script>

<style lang="scss" module>
.category {
  @apply mt-8;
}
</style>
