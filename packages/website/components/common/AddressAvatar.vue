<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { useBlockie } from '~/composables/use-blockie';

interface Props {
  ensName?: string | null;
  address: string;
}

const props = defineProps<Props>();

const { address, ensName } = toRefs(props);

const avatarUrl = ref<string>();
const loading = ref<boolean>(false);
const hasError = ref<boolean>(false);

const { getBlockie } = useBlockie();

// Get blockie for the address
const blockieUrl = computed(() => getBlockie(get(address)));

async function fetchAvatar() {
  const ens = get(ensName);
  if (!ens) {
    return;
  }

  try {
    set(loading, true);
    set(hasError, false);

    const url = `/api/ens/avatar?name=${encodeURIComponent(ens)}`;
    // Use our cached ENS avatar endpoint
    const response = await fetch(url);

    if (response.ok) {
      // Use our cached endpoint URL
      set(avatarUrl, url);
    }
    else {
      set(hasError, true);
    }
  }
  catch {
    set(hasError, true);
  }
  finally {
    set(loading, false);
  }
}

onMounted(() => {
  fetchAvatar();
});

// Re-fetch if ENS name changes
watch(ensName, () => {
  fetchAvatar();
});
</script>

<template>
  <div class="relative rounded-full overflow-hidden shrink-0 size-10">
    <!-- Loading state for ENS avatar -->
    <RuiSkeletonLoader
      v-if="loading && ensName"
      rounded="full"
      class="w-full h-full"
    />

    <!-- ENS Avatar image -->
    <img
      v-else-if="avatarUrl && !hasError && ensName"
      :src="avatarUrl"
      :alt="`${ensName} avatar`"
      class="w-full h-full object-cover"
      @error="hasError = true"
    />

    <!-- Fallback to blockie -->
    <img
      v-else-if="blockieUrl"
      :src="blockieUrl"
      :alt="`Blockie for ${address}`"
      class="w-full h-full"
    />
  </div>
</template>
