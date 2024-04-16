<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <RuiCard>
    <div class="flex items-center space-x-4">
      <div
        class="rounded-full w-10 h-10 flex items-center justify-center bg-rui-primary/[0.04]"
      >
        <AppLogo size="1.5" />
      </div>
      <div>
        <div class="text-body-1">
          {{ t('account.no_premium.title') }}
        </div>
        <div class="text-rui-text-secondary">
          <i18n-t
            keypath="account.no_premium.no_premium_found"
            scope="global"
          >
            <template #plan>
              <ButtonLink
                inline
                color="primary"
                to="/checkout/pay"
                class="underline"
              >
                {{ t('account.no_premium.plan') }}
              </ButtonLink>
            </template>
          </i18n-t>
        </div>
      </div>
    </div>
  </RuiCard>
</template>
