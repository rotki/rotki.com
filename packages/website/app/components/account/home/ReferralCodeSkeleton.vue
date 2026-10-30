<template>
  <div class="space-y-5">
    <RuiSkeletonLoader class="h-10 w-full" />
    <div class="flex items-center gap-2">
      <RuiSkeletonLoader
        v-for="i in 5"
        :key="i"
        class="h-9 w-9"
        rounded="sm"
      />
    </div>
    <RuiSkeletonLoader class="h-4 w-full max-w-lg" />
  </div>
</template>
