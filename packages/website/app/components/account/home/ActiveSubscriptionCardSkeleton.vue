<template>
  <div class="rounded-lg border border-default p-5 md:p-7 flex flex-col gap-7">
    <div class="min-w-0 flex flex-col gap-6">
      <div class="flex items-center gap-3">
        <RuiSkeletonLoader class="h-7 w-48" />
        <RuiSkeletonLoader
          class="h-6 w-16"
          rounded="full"
        />
      </div>
      <div class="flex flex-wrap gap-x-12 gap-y-5">
        <div
          v-for="i in 2"
          :key="i"
          class="space-y-2"
        >
          <RuiSkeletonLoader class="h-3 w-24" />
          <RuiSkeletonLoader class="h-7 w-28" />
          <RuiSkeletonLoader class="h-3.5 w-36" />
        </div>
      </div>
      <div class="flex gap-2">
        <RuiSkeletonLoader class="h-9 w-28" />
        <RuiSkeletonLoader class="h-9 w-28" />
      </div>
    </div>
    <div class="rounded-lg bg-rui-grey-50 dark:bg-rui-grey-900 p-5">
      <RuiSkeletonLoader class="h-3.5 w-36" />
      <!-- The limits grid of PlanLimitsList, then its Show more button -->
      <div class="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          v-for="i in 4"
          :key="i"
          class="space-y-1.5"
        >
          <RuiSkeletonLoader class="h-3.5 w-32" />
          <RuiSkeletonLoader class="h-4 w-40" />
        </div>
      </div>
      <RuiSkeletonLoader class="mt-3 h-7 w-24" />
    </div>
  </div>
</template>
