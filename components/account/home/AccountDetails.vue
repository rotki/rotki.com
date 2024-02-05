<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account } = storeToRefs(store);

const email = computed(() => {
  const userAccount = account.value;
  return !userAccount ? '' : userAccount.email;
});

const { t } = useI18n();
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      Details
    </div>
    <div>
      <div class="space-y-5">
        <RuiTextField
          id="email"
          v-model="email"
          disabled
          variant="outlined"
          :label="t('auth.common.email')"
          hide-details
          color="primary"
        />
      </div>

      <div class="mt-10 mb-5 border-t border-grey-50" />
    </div>
  </div>
</template>
