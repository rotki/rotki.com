<template>
  <div class="flex gap-5 items-start">
    <div
      class="border-r-[3px] border-rui-primary pb-2.5 pr-5 text-h5 text-rui-primary"
    >
      <slot name="number" />
    </div>
    <div class="space-y-4">
      <div class="text-h5">
        <slot name="title" />
      </div>
      <div class="text-rui-text-secondary text-body-1 whitespace-break-spaces">
        <slot name="values" />
      </div>
    </div>
  </div>
</template>
