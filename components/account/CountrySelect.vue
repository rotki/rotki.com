<template>
  <div :class="$style.wrapper">
    <div>
      <div :class="$style.inputContainer">
        <div v-if="countries" :class="$style.dropdown">
          <span
            v-if="selected && searchFilter === selected.name"
            :class="$style.flag"
          >
            {{ getFlagEmoji(selected.code) }}</span
          >
          <input
            :id="id"
            v-model="searchFilter"
            :name="id"
            autocomplete="off"
            :class="{
              [$style.input]: true,
              [$style.empty]: isEmpty,
            }"
            :disabled="disabled"
            @focus="showOptions()"
            @blur="exit()"
            @keyup="keyMonitor"
          />
          <label
            v-if="label"
            :class="{
              [$style.label]: true,
              [$style.select]: true,
            }"
            :for="id"
          >
            {{ label }}
          </label>

          <div v-show="optionsShown" :class="$style.content">
            <div
              v-for="(option, index) in filteredOptions"
              :key="index"
              :class="$style.item"
              @mousedown="selectOption(option)"
            >
              {{ getFlagEmoji(option.code) }}
              {{ option.name || '-' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <span
      v-if="errorMessages && errorMessages.length > 0"
      :id="`${id}-error`"
      :class="$style.error"
    >
      {{ errorMessages[0].$message }}
    </span>

    <span v-else :class="$style.caption">
      <slot name="hint">{{ hint }}</slot>
    </span>
    <slot />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRefs,
  watch,
} from '@nuxtjs/composition-api'
import { debouncedWatch, get, set } from '@vueuse/core'
import { Country } from '~/composables/countries'

export default defineComponent({
  name: 'CountrySelect',
  props: {
    value: {
      type: String,
      required: true,
    },
    countries: {
      type: Array as PropType<Country[]>,
      required: true,
      default: () => [],
    },
    label: {
      type: String,
      required: true,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    errorMessages: {
      type: Array,
      required: true,
      default: () => [],
    },
    hint: {
      type: String,
      required: false,
      default: '',
    },
    id: {
      type: String,
      required: true,
    },
  },
  emits: ['input', 'blur'],
  setup(props, { emit }) {
    const { countries, value, disabled } = toRefs(props)
    const selected = ref<Country | null>(null)
    const optionsShown = ref(false)
    const searchFilter = ref('')

    const filteredOptions = computed(() => {
      const filtered: Country[] = []
      const filter = get(searchFilter)
      const regOption = new RegExp(filter, 'ig')
      for (const option of get(countries)) {
        if (filter.length < 1 || option.name.match(regOption)) {
          filtered.push(option)
        }
      }
      return filtered
    })

    const selectOption = (option: Country) => {
      set(selected, option)
      set(optionsShown, false)
      set(searchFilter, option.name)
      emit('input', option.code)
    }

    const showOptions = () => {
      if (!get(disabled)) {
        set(searchFilter, '')
        set(optionsShown, true)
      }
    }

    const exit = () => {
      const filtered = get(filteredOptions)
      if (filtered.length > 0 && get(searchFilter)) {
        selectOption(filtered[0])
      } else {
        const selection = get(selected)
        if (selection) {
          selectOption(selection)
        } else {
          set(searchFilter, '')
        }
      }
      set(optionsShown, false)
      emit('blur')
    }

    const keyMonitor = (event: KeyboardEvent) => {
      const filtered = get(filteredOptions)
      if (event.key === 'Enter' && filtered[0]) {
        selectOption(filtered[0])
      }
    }

    const getFlagEmoji = (code: string) => {
      const codePoints = code
        .toUpperCase()
        .split('')
        .map((char) => 127397 + char.charCodeAt(0))
      return String.fromCodePoint(...codePoints)
    }

    const isEmpty = computed(() => {
      const filter = get(searchFilter)
      const selection = get(selected)
      return !filter || selection?.name !== filter
    })

    watch(selected, (newValue, oldValue) => {
      if (newValue && newValue !== oldValue) {
        emit('input', newValue?.code ?? '')
      }
    })
    onMounted(() => setCountryUsingCode(get(value)))

    function setCountryUsingCode(value: string) {
      const cnt = get(countries)
      const country = cnt.find(({ code }) => code === value)
      if (country && country !== get(selected)) {
        selectOption(country)
      }
    }

    debouncedWatch(
      value,
      (value) => {
        if (!value) {
          set(selected, null)
        } else {
          setCountryUsingCode(value)
        }
      },
      { debounce: 800 }
    )

    return {
      isEmpty,
      selected,
      optionsShown,
      searchFilter,
      filteredOptions,
      getFlagEmoji,
      selectOption,
      showOptions,
      exit,
      keyMonitor,
    }
  },

  created() {
    this.$emit('selected', this.selected)
  },
})
</script>

<style lang="scss" module>
.wrapper {
  @apply flex flex-col pt-2.5;
}

.inputContainer {
  @apply relative w-full;
}

.input {
  @apply block border-shade10 box-border border-solid focus:outline-none focus:border-primary pr-2 px-3 appearance-none w-full bg-white;

  margin-top: 8px;
  border-width: 1px;
  border-radius: 8px;
  height: 56px;

  & ~ label {
    @apply top-4;

    transform-origin: 0 0;
    left: 26px;
  }

  &:focus-within ~ label {
    @apply transform scale-75 -translate-y-4 text-primary3 duration-300;
  }

  &:not(.empty) {
    @apply pl-9;
  }

  &:not(.empty):not(:focus-within) ~ label {
    @apply transform scale-75 -translate-y-4 text-label duration-300;
  }

  &:disabled {
    @apply bg-gray-200;
  }
}

.label {
  @apply font-sans absolute top-4 text-label text-sm;
}

.dropdown {
  @apply relative block m-auto;

  .dropdown:hover .content {
    @apply block;
  }
}

.content {
  @apply absolute bg-white max-h-60 border border-solid border-shade2 shadow-md overflow-auto z-10;

  min-width: 280px;
  max-width: 280px;
}

.item {
  @apply font-sans text-base text-shade11 p-2 block cursor-pointer;

  text-decoration: none;

  &:hover {
    background-color: #e7ecf5;
  }
}

.caption {
  @apply text-xs font-sans;

  color: #808080;
  margin-top: 8px;
}

.error {
  color: #e53935;

  @extend .caption;
}

.empty {
  @apply pl-3;
}

.flag {
  @apply absolute top-4 left-3;
}
</style>
