<script setup lang="ts">
/** Backend errors that belong to no field of the form, from `useZodForm`'s `formErrors`. */
const { messages, title } = defineProps<{
  messages: readonly string[];
  title?: string;
}>();

defineSlots<{
  /** Actions under the messages, such as a button to the form that can fix them. */
  default?: () => any;
}>();
</script>

<template>
  <RuiAlert
    v-if="messages.length > 0"
    type="error"
  >
    <template v-if="title">
      {{ title }}
    </template>
    <ul
      v-if="title || messages.length > 1"
      class="mt-1 list-disc ps-5"
    >
      <li
        v-for="message in messages"
        :key="message"
      >
        {{ message }}
      </li>
    </ul>
    <template v-else>
      {{ messages[0] }}
    </template>
    <slot />
  </RuiAlert>
</template>
