<template>
  <PageContainer wide :center-vertically="false">
    <template #title>Select a Plan</template>
    <LoadingIndicator v-if="!plans" full />
    <PageContent v-else>
      <PlanSelection :plans="plans" />
    </PageContent>
  </PageContainer>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useMainStore } from '~/store'

const store = useMainStore()
const { plans } = storeToRefs(store)
onMounted(async () => await store.getPlans())
</script>
