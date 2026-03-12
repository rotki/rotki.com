<script setup lang="ts">
import type { ContextColorsType } from '@rotki/ui-library';
import type { RouteLocationRaw } from 'vue-router';

defineOptions({
  inheritAttrs: false,
});

const {
  to,
  external = false,
  inline = false,
  highlightActive = false,
  highlightExactActive = false,
  color,
  icon,
  disabled,
} = defineProps<{
  to: RouteLocationRaw;
  external?: boolean;
  inline?: boolean;
  highlightActive?: boolean;
  highlightExactActive?: boolean;
  color?: ContextColorsType;
  icon?: boolean;
  disabled?: boolean;
}>();

defineSlots<{
  prepend: () => void;
  default: () => void;
  append: () => void;
}>();

// Routes that require hard reloads due to special CSP configurations
const SPECIAL_CSP_ROUTES = [
  // Payment routes
  '/checkout/pay',
  '/checkout/pay/card',
  '/checkout/pay/crypto',
  '/checkout/pay/method',
  '/checkout/pay/paypal',
  '/checkout/pay/request-crypto',
  // Auth routes
  '/signup',
  '/password/recover',
  // Sponsor routes
  '/sponsor',
] as const;

/**
 * Determine if this link should be treated as external (forcing hard reload)
 */
const isExternalLink = computed<boolean>(() =>
  external || requiresHardReload(to),
);

/**
 * Determine target attribute - only open new tab for truly external links
 */
const linkTarget = computed<string>(() => {
  // Only open new tab for explicitly external links (not CSP hard reload routes)
  if (external && !requiresHardReload(to)) {
    return '_blank';
  }
  return '_self';
});

/**
 * Check if a route requires hard reload due to special CSP configuration
 */
function requiresHardReload(route: RouteLocationRaw): boolean {
  if (typeof route === 'string') {
    return SPECIAL_CSP_ROUTES.some(cspRoute =>
      route === cspRoute || (cspRoute === '/sponsor' && route.startsWith('/sponsor')),
    );
  }

  if (typeof route === 'object' && route.path) {
    return SPECIAL_CSP_ROUTES.some(cspRoute =>
      route.path === cspRoute || (cspRoute === '/sponsor' && route.path?.startsWith('/sponsor')),
    );
  }

  return false;
}

function getColor(active: boolean, exact: boolean): ContextColorsType | undefined {
  if ((highlightActive && active) || (highlightExactActive && exact)) {
    return 'primary';
  }

  return undefined;
}
</script>

<template>
  <NuxtLink
    #default="link"
    :class="{ 'inline-flex': inline }"
    :to="to"
    :external="isExternalLink"
    :target="linkTarget"
  >
    <RuiButton
      v-bind="{
        variant: 'text',
        type: 'button',
        color: color ?? getColor(link?.isActive, link?.isExactActive),
        icon,
        disabled,
        ...$attrs,
      }"
      :class="{ ['inline-flex py-0 !px-1 !text-[1em]']: inline }"
    >
      <template #prepend>
        <slot name="prepend" />
      </template>
      <slot>
        {{ link?.href }}
      </slot>
      <template #append>
        <slot name="append" />
      </template>
    </RuiButton>
  </NuxtLink>
</template>
