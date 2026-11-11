<script setup lang="ts">
import type { ButtonProps, ContextColorsType } from '@rotki/ui-library';
import type { ButtonHTMLAttributes } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { requiresHardReload } from '~/utils/navigation';

/** What the link passes on to its RuiButton, typed by the button itself. */
type ForwardedButtonProps = Pick<ButtonProps, 'variant' | 'size' | 'rounded'> & Pick<ButtonHTMLAttributes, 'title'>;

/*
 * The link's own options. The SFC compiler is told to skip the forwarded button props, so they stay
 * attributes at runtime and reach the button through `$attrs`, while templates still type-check them.
 * This comment must not name the compiler hint: Vue looks for it in any comment before the type.
 */
// eslint-disable-next-line jsdoc/no-bad-blocks -- the SFC compiler reads this as a plain block comment
interface ButtonLinkProps extends /* @vue-ignore */ ForwardedButtonProps {
  to: RouteLocationRaw;
  external?: boolean;
  inline?: boolean;
  highlightActive?: boolean;
  highlightExactActive?: boolean;
  color?: ContextColorsType;
  icon?: boolean;
  disabled?: boolean;
}

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
} = defineProps<ButtonLinkProps>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

defineSlots<{
  prepend: () => void;
  default: () => void;
  append: () => void;
}>();

/**
 * Determine if this link should be treated as external (forcing hard reload)
 */
const isExternalLink = computed<boolean>(() =>
  external || requiresHardReload(to),
);

/**
 * Determine target attribute. Only explicitly external links open a new tab;
 * CSP hard reload routes stay in the same tab.
 */
const linkTarget = computed<string>(() => {
  if (external && !requiresHardReload(to)) {
    return '_blank';
  }
  return '_self';
});

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
      :class="{ ['inline-flex py-0 px-1! text-[1em]!']: inline }"
      @click="emit('click', $event)"
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
