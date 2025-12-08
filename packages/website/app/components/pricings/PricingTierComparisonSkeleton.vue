<template>
  <div
    class="relative hidden xl:grid"
    :style="{
      gridTemplateColumns: `minmax(195px, 250px) repeat(4, minmax(195px, 1fr))`,
    }"
  >
    <RuiCard
      v-for="i in 5"
      :key="i"
      variant="flat"
      content-class="!pt-16"
    >
      <RuiSkeletonLoader class="w-32 h-6 mb-4" />
      <RuiSkeletonLoader class="w-full h-10 mb-6" />
      <RuiSkeletonLoader class="w-full h-6 mb-4" />
      <RuiSkeletonLoader class="w-full h-10" />
      <div class="flex flex-col gap-6 pt-6">
        <RuiSkeletonLoader
          v-for="j in 5"
          :key="j"
          class="w-full h-4"
        />
      </div>
    </RuiCard>
  </div>
  <div class="block xl:hidden pt-10">
    <RuiSkeletonLoader class="w-32 h-6 mb-4" />
    <RuiSkeletonLoader class="w-48 h-10 mb-6" />
    <RuiSkeletonLoader class="w-56 h-6 mb-4" />
    <RuiSkeletonLoader class="w-full h-10" />
    <div class="flex flex-col gap-6 pt-6">
      <RuiSkeletonLoader
        v-for="j in 5"
        :key="j"
        class="w-full h-4"
      />
    </div>
  </div>
</template>
