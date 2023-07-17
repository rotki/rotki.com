<script setup lang="ts">
withDefaults(
  defineProps<{
    full?: boolean;
  }>(),
  {
    full: false,
  },
);
const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.container]: true,
      [css.full]: full,
    }"
  >
    <div :class="css.loader">
      <svg :class="css.circular" viewBox="25 25 50 50">
        <circle
          :class="css.path"
          cx="50"
          cy="50"
          fill="none"
          r="20"
          stroke-miterlimit="10"
          stroke-width="2"
        />
      </svg>
    </div>
  </div>
</template>

<style lang="scss" module>
.container {
  padding: 5%;

  &.full {
    @apply h-full w-full flex flex-row items-center;
  }
}

.loader {
  position: relative;
  margin: 0 auto;
  width: 100px;

  &::before {
    content: '';
    display: block;
    padding-top: 100%;
  }
}

.circular {
  animation: rotate 2s linear infinite;
  height: 100%;
  transform-origin: center center;
  width: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
}

.path {
  stroke: #da4e24;
  stroke-dasharray: 1, 200;
  stroke-dashoffset: 0;
  animation:
    dash 1.5s ease-in-out infinite,
    color 6s ease-in-out infinite;
  stroke-linecap: round;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
}
</style>
