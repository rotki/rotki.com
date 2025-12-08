<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div>
    <div class="text-h6 mb-6">
      {{ t('account.referral_code.title') }}
    </div>

    <RuiCard
      variant="flat"
      class="!bg-rui-grey-50 dark:!bg-rui-grey-900 p-1 border border-rui-grey-300 dark:border-rui-grey-800"
    >
      <div class="min-h-[10rem] space-y-4">
        <!-- Description -->
        <div class="mb-8">
          <RuiSkeletonLoader class="h-4 w-full max-w-xl" />
        </div>

        <!-- Referral Code Field and Share Buttons -->
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <RuiSkeletonLoader class="h-10 md:flex-1" />

          <div class="flex items-center gap-3">
            <RuiSkeletonLoader class="h-4 w-20" />
            <div class="flex items-center gap-2">
              <RuiSkeletonLoader
                v-for="i in 5"
                :key="i"
                class="h-9 w-9"
                rounded="sm"
              />
            </div>
          </div>
        </div>

        <!-- Discount Alert -->
        <div class="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div class="flex gap-3">
            <RuiSkeletonLoader
              class="h-5 w-5 shrink-0"
              rounded="sm"
            />
            <div class="flex-1 space-y-2">
              <RuiSkeletonLoader class="h-5 w-48" />
              <RuiSkeletonLoader class="h-4 w-full max-w-lg" />
            </div>
          </div>
        </div>

        <!-- Coming Soon Alert -->
        <div class="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div class="flex gap-3">
            <RuiSkeletonLoader
              class="h-5 w-5 shrink-0"
              rounded="sm"
            />
            <div class="flex-1">
              <RuiSkeletonLoader class="h-5 w-64" />
            </div>
          </div>
        </div>
      </div>
    </RuiCard>
  </div>
</template>
