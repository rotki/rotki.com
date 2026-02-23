<script setup lang="ts">
interface Props {
  visible: boolean;
}

defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center justify-center text-center px-4 max-w-lg">
          <div class="mb-6">
            <RuiIcon
              name="lu-triangle-alert"
              size="64"
              color="warning"
            />
          </div>
          <h3 class="text-xl font-semibold text-white mb-3">
            {{ t('subscription.error.server_error_title') }}
          </h3>
          <p class="text-white/80 mb-8">
            {{ t('subscription.error.server_error_description') }}
          </p>
          <RuiButton
            size="lg"
            color="primary"
            @click="navigateTo('/home/subscription')"
          >
            {{ t('subscription.error.check_subscription') }}
          </RuiButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
