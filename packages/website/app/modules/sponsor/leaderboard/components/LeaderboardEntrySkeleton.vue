<template>
  <div class="flex items-center gap-3 sm:gap-4 flex-1 min-h-[64px]">
    <RuiSkeletonLoader
      class="w-10 h-10 shrink-0"
      rounded="full"
    />
    <RuiSkeletonLoader
      class="w-10 h-10 shrink-0"
      rounded="full"
    />
    <div class="flex-1 space-y-2">
      <RuiSkeletonLoader class="w-48 max-w-full h-4" />
      <RuiSkeletonLoader class="w-32 max-w-full h-3" />
    </div>
    <RuiSkeletonLoader class="w-16 h-5 shrink-0" />
  </div>
</template>
