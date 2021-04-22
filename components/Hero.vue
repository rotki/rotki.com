<template>
  <div class="mt-21">
    <div class="flex flex-row justify-center text-7xl font-serif text-primary2">
      <div class="flex-col col-auto text-center">
        <div class="flex-row">Portfolio manager that</div>
        <div class="flex-row">respects your privacy</div>
      </div>
    </div>
    <div
      class="flex flex-row justify-center font-sans font-light text-primary2 mt-9 text-4xl"
    >
      <div class="flex-col col-auto text-center">
        <div class="flex-row">
          <div class="flex-col max-w-2xl">
            Rotki is an open source portfolio tracker, accounting and analytics
            tool that respects your privacy.
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-row justify-center mt-16">
      <download-button @click="$emit('download')" />
      <action-button class="ml-8" text="Get Premium" />
    </div>
    <div class="flex flex-row justify-center mt-32">
      <img src="~/assets/img/macbook.png" />
    </div>
    <div class="flex flex-row mt-32 justify-center">
      <div class="flex-col">
        <div class="flex flex-row justify-center">
          <div class="flex-col font-serif text-primary2 text-4xl">
            Open source
          </div>
        </div>
        <div class="flex flex-row justify-center mt-6 max-w-xs">
          <div class="flex-col font-sans text-primary2 text-2xl text-center">
            Rotki is a local application. And its basic version is free.
          </div>
        </div>
      </div>
      <div class="flex-col ml-12">
        <div class="flex flex-row justify-center">
          <div class="flex-col font-serif text-primary2 text-4xl">
            Local app
          </div>
        </div>
        <div class="flex flex-row justify-center mt-6 max-w-xs">
          <div class="flex-col font-sans text-primary2 text-2xl text-center">
            Rotki is a local application. And its basic version is also free.
          </div>
        </div>
      </div>
      <div class="flex-col ml-12">
        <div class="flex flex-row justify-center">
          <div class="flex-col font-serif text-primary2 text-4xl">
            Own your data
          </div>
        </div>
        <div class="flex flex-row justify-center mt-6 max-w-xs">
          <div class="flex-col font-sans text-primary2 text-2xl text-center">
            A local application allows you to own your data. You don’t need to
            give your financial history to a centralized third party.
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-row mt-12 justify-center align-middle">
      <div class="flex-col col-span-4">
        <img src="~/assets/img/accountant.svg" class="h-101" />
      </div>
      <div class="flex-col col-auto max-w-xl ml-16 self-center">
        <div class="flex flex-row">
          <div class="flex-col text-shade8 text-3xl font-regular align-middle">
            Rotki offers tracking of all your crypto assets no matter where they
            are. Either on a blockchain or on one of the supported exchanges.
          </div>
        </div>
        <download-button class="mt-14" @click="$emit('download')" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Hero',
})
</script>
