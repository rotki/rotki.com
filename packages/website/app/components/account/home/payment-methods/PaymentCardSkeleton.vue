<script setup lang="ts">
// Skeleton loader for payment card
</script>

<template>
  <RuiCard>
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <!-- Card logo container -->
        <div class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center p-1">
          <RuiSkeletonLoader class="w-full h-full rounded" />
        </div>
        <!-- Card details -->
        <div>
          <div class="mb-1">
            <RuiSkeletonLoader class="w-40 h-[22px]" />
          </div>
          <div>
            <RuiSkeletonLoader class="w-28 h-[18px]" />
          </div>
        </div>
      </div>
      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Linked card section -->
        <div class="flex flex-col items-center gap-1">
          <RuiSkeletonLoader class="w-32 h-[24px] rounded-full" />
          <RuiSkeletonLoader class="w-24 h-[32px] rounded" />
        </div>
        <!-- Delete button -->
        <RuiSkeletonLoader class="w-10 h-10 rounded" />
      </div>
    </div>
  </RuiCard>
</template>
