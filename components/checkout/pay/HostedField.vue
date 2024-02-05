<script lang="ts" setup>
import { get } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    id: string;
    label?: string;
    focused?: boolean;
    valid?: boolean;
    number?: boolean;
    empty?: boolean;
    hideDetails?: boolean;
    disabled?: boolean;
    dense?: boolean;
  }>(),
  {
    label: '',
  },
);

const emit = defineEmits<{ (e: 'click'): void }>();
const css = useCssModule();

const { disabled, id, label } = toRefs(props);

const quotedLabel = computed(() => `"  ${get(label)}  "`);
</script>

<template>
  <div
    :class="[
      css.wrapper,
      css.outlined,
      {
        [css.dense]: dense,
        [css['with-error']]: !valid,
        [css['no-label']]: !label,
        [css.number]: number,
        [css.disabled]: disabled,
      },
    ]"
    @click.stop.prevent="!disabled ? emit('click') : null"
  >
    <div class="flex items-center shrink-0">
      <div
        v-if="number"
        :class="[css.icon, css.prepend]"
      >
        <RuiIcon name="bank-card-line" />
      </div>
    </div>
    <div class="flex flex-1 overflow-hidden">
      <div
        :id="id"
        :class="[css.input, { [css.empty]: empty }]"
      />
      <label
        :class="css.label"
        :for="id"
      >
        {{ label }}
      </label>
      <fieldset :class="css.fieldset">
        <legend />
      </fieldset>
    </div>
  </div>
</template>

<style lang="scss" module>
:global(.dark) {
  .wrapper {
    .label {
      @apply border-white/[0.42];

      &:after {
        @apply border-white;
      }
    }

    .icon {
      @apply text-white/[0.56];
    }

    &.outlined {
      .fieldset {
        @apply border-white/[0.23];
      }

      .input {
        &:focus {
          ~ .fieldset {
            @apply border-white;
          }
        }
      }
    }
  }
}

.wrapper {
  @apply relative w-full flex items-center pt-3;

  .input {
    @apply leading-6 text-rui-text w-full bg-transparent pr-3 outline-0 outline-none transition-all placeholder:opacity-0 focus:placeholder:opacity-100 h-[3.5rem];

    &:global(.braintree-hosted-fields-focused),
    &:not(.empty) {
      @apply outline-0;

      + .label {
        @apply after:scale-x-100  text-xs leading-tight;
        padding-left: var(--x-padding);
        padding-right: var(--x-padding);
      }
    }
  }

  .label {
    @apply left-0 text-base leading-[3.75] text-rui-text-secondary pointer-events-none absolute top-0 flex h-full w-full select-none transition-all border-b border-black/[0.42];

    padding-left: calc(var(--x-padding) + var(--prepend-width, 0px));

    &:after {
      content: '';
      @apply absolute bottom-0 left-0 block w-full scale-x-0 border-b-2 mb-[-1px] transition-transform duration-300 border-black;
    }
  }

  .icon {
    @apply text-black/[0.54];
  }

  .prepend {
    @apply mr-2;
  }

  &.number {
    --x-padding: 0px;
    --prepend-width: 2.25rem;
  }

  &.disabled {
    .input {
      @apply border-dotted;
      pointer-events: none;

      &,
      + .label {
        @apply text-rui-text-disabled;
      }

      ~ .fieldset {
        @apply border-dotted;
      }
    }
  }

  &.with-error {
    .input {
      @apply border-rui-error #{!important};
    }

    .label {
      @apply text-rui-error after:border-rui-error #{!important};
    }

    .fieldset {
      @apply border-rui-error #{!important};
    }
  }

  &.dense {
    .input {
      @apply py-1;
    }

    .label {
      @apply leading-[3.5];
    }
  }

  &.outlined {
    @apply pt-0;

    .prepend {
      @apply ml-3 mr-0;
    }

    .label {
      @apply leading-[3.5] border-0 border-transparent;
      --x-padding: 0.75rem;

      &:after {
        content: none !important;
      }
    }

    .input {
      @apply border-b-0 px-3;

      &:global(.braintree-hosted-fields-focused),
      &:not(.empty) {
        @apply border-t-transparent;

        + .label {
          @apply leading-[0] pl-4;
        }

        ~ .fieldset {
          @apply border-2 border-rui-primary;

          legend {
            &:after {
              content: v-bind(quotedLabel);
            }
          }
        }
      }
    }

    .fieldset {
      @apply absolute w-full top-0 left-0 pointer-events-none rounded border border-black/[0.23] px-2 transition-all -mt-2;
      height: calc(100% + 0.5rem);

      legend {
        @apply opacity-0 text-xs;

        &:after {
          @apply whitespace-break-spaces;
          content: '\200B';
        }
      }
    }

    &.dense {
      .input {
        @apply py-2;
      }

      .label {
        @apply leading-[2.5];
      }
    }
  }
}
</style>
