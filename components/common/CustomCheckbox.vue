<template>
  <div :class="css.checkbox">
    <input
      :id="id"
      :modelValue="modelValue"
      type="checkbox"
      @click="update(!modelValue)"
    />
    <label :class="css.label" :for="id">
      <slot></slot>
    </label>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    modelValue: boolean
  }>(),
  {
    id: '',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const update = (checked: boolean) => {
  emit('update:modelValue', checked)
}

const css = useCssModule()
</script>

<style lang="scss" module>
.checkbox {
  @apply flex flex-row items-center;

  font-size: 15px;
  line-height: 18px;
  margin-top: 16px;

  input {
    @apply text-primary3;
  }
}

.label {
  @apply ml-4;
}
</style>
