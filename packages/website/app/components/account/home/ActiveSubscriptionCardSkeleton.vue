<template>
  <div>
    <RuiCard class="!border-l-4 !border-l-gray-300 dark:!border-l-gray-600">
      <!-- Next Billing Skeleton -->
      <div class="mb-6 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
        <div class="flex items-center justify-between">
          <div class="w-full space-y-3">
            <div class="flex items-center gap-2 mb-1">
              <RuiSkeletonLoader
                class="h-4 w-4"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-3.5 w-24" />
            </div>
            <RuiSkeletonLoader class="h-8 w-24 mb-1" />
            <RuiSkeletonLoader class="h-3.5 w-52" />
          </div>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Left Column Skeleton -->
        <div class="space-y-4">
          <!-- Plan -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <RuiSkeletonLoader
                class="h-4 w-4"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-4 w-16" />
            </div>
            <RuiSkeletonLoader class="h-6 w-48" />
          </div>

          <!-- Created Date -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <RuiSkeletonLoader
                class="h-4 w-4"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-4 w-24" />
            </div>
            <RuiSkeletonLoader class="h-6 w-40" />
            <RuiSkeletonLoader class="h-4 w-32 mt-1" />
          </div>

          <!-- Status -->
          <div>
            <div class="flex items-center gap-2 mb-1">
              <RuiSkeletonLoader
                class="h-4 w-4"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-4 w-16" />
            </div>
            <RuiSkeletonLoader class="h-6 w-36" />
          </div>
        </div>

        <!-- Right Column Skeleton -->
        <div class="space-y-4">
          <!-- Plan Limits -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <RuiSkeletonLoader
                class="h-4 w-4"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-4 w-24" />
            </div>
            <div class="space-y-2">
              <div
                v-for="i in 4"
                :key="i"
                class="flex justify-between items-center gap-2"
              >
                <RuiSkeletonLoader class="h-4 w-32" />
                <RuiSkeletonLoader class="h-5 w-5 rounded-full" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <RuiSkeletonLoader
                class="h-4 w-4"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-4 w-16" />
            </div>
            <div class="flex items-center gap-2">
              <RuiSkeletonLoader
                class="h-3 w-3"
                rounded="sm"
              />
              <RuiSkeletonLoader class="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    </RuiCard>
  </div>
</template>
