<script setup lang="ts">
import { navigation, routes } from '@/utils/navigation';
import logoSmall from '/img/logo-small.svg';
</script>

<template>
  <div class="py-4 md:py-6 border-b border-rui-grey-200">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between">
        <!-- Logo on the left -->
        <a
          :href="routes.home"
          class="flex items-center"
        >
          <img
            :src="logoSmall"
            alt="Rotki Logo"
            class="h-10"
          />
        </a>

        <!-- Buttons on the right -->
        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 text-rui-primary hover:bg-rui-primary/10 hover:rounded text-sm transition-colors"
            @click="navigation.goToHome"
          >
            Home
          </button>
          <button
            class="px-4 py-2 bg-rui-primary text-white rounded-full hover:bg-rui-primary-darker transition-colors text-sm font-medium shadow-sm"
            @click="navigation.goToSubscription"
          >
            Manage Premium
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
