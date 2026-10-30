<template>
  <div class="rounded-lg border border-default p-4 md:px-5 flex flex-wrap items-center gap-x-4 gap-y-3">
    <!-- Mirrors PaymentCard row by row, so the list does not move when the cards arrive -->
    <RuiSkeletonLoader
      class="h-9 w-14 shrink-0"
      rounded="md"
    />
    <div class="flex-1 min-w-40">
      <div class="h-6 flex items-center">
        <RuiSkeletonLoader class="h-4 w-40" />
      </div>
      <div class="h-5 flex items-center">
        <RuiSkeletonLoader class="h-3.5 w-28" />
      </div>
    </div>
    <RuiSkeletonLoader
      class="h-6 w-32"
      rounded="full"
    />
    <div class="flex items-center gap-1">
      <RuiSkeletonLoader class="h-9 w-28" />
      <RuiSkeletonLoader class="size-9" />
    </div>
  </div>
</template>
