<script setup lang="ts">
const css = useCssModule();
</script>
<template>
  <CardContainer>
    <div :class="css.row">
      <div :class="css.logo">
        <img alt="rotki" src="/img/logo-small.svg" />
      </div>
      <div>
        <TextHeading subheading> Rotki Premium </TextHeading>
        <div :class="css.premium">
          No premium subscription found. Select your
          <NuxtLink :class="css.link" to="/checkout/plan">
            premium subscription plan.
          </NuxtLink>
        </div>
      </div>
    </div>
  </CardContainer>
</template>
<style lang="scss" module>
@import '@/assets/css/media.scss';

.row {
  @apply flex flex-row items-center;
}

.premium {
  @apply mt-2;
}

.logo {
  margin: 16px 60px 16px 16px;
}

.link {
  @apply hover:text-shade8 text-primary;
}
</style>
