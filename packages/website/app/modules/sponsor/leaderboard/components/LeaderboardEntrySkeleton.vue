<template>
  <div class="flex items-center space-x-4 flex-1 min-h-[74px]">
    <RuiSkeletonLoader
      class="w-10 h-10 shrink-0"
      rounded="full"
    />
    <div class="flex-1 space-y-2">
      <RuiSkeletonLoader class="w-48 h-4" />
      <RuiSkeletonLoader class="w-32 h-3" />
      <RuiSkeletonLoader class="w-16 h-5" />
    </div>
    <RuiSkeletonLoader class="w-8 h-7" />
  </div>
</template>
