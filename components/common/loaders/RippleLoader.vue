<template>
  <div :class="$style.ripple">
    <div />
    <div />
  </div>
</template>

<style lang="scss" module>
.ripple {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}

.ripple div {
  position: absolute;
  border: 4px solid #fff;
  opacity: 1;
  border-radius: 50%;
  animation: ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite;
}
.ripple div:nth-child(2) {
  animation-delay: -0.8s;
}
@keyframes ripple {
  0% {
    top: 36px;
    left: 36px;
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    top: 0;
    left: 0;
    width: 72px;
    height: 72px;
    opacity: 0;
  }
}
</style>
