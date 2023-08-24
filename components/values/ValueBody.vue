<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <img src="/img/scenery.jpg" alt="Rotki values" />
  </div>
  <div class="py-10 md:py-20 bg-rui-primary/[0.04]">
    <div
      class="container grid items-start md:grid-flow-col grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_3rem_auto] gap-y-10 md:gap-y-0 gap-x-20"
    >
      <div class="space-y-5">
        <div class="text-h4">{{ t('values.values_section.title') }}</div>
        <div>
          {{ t('values.values_section.description') }}
        </div>
      </div>
      <div class="border-t border-rui-grey-300 self-center" />
      <div class="flex gap-5 items-start">
        <div
          class="border-r-[3px] border-rui-primary pb-2.5 pr-5 text-h5 text-rui-primary"
        >
          01
        </div>
        <div class="space-y-4">
          <div class="text-h5">
            {{ t('values.values_section.list.1.title') }}
          </div>
          <div
            class="text-rui-text-secondary text-body-1 whitespace-break-spaces"
          >
            {{ t('values.values_section.list.1.value') }}
          </div>
        </div>
      </div>
      <div class="flex gap-5 items-start">
        <div
          class="border-r-[3px] border-rui-primary pb-2.5 pr-5 text-h5 text-rui-primary"
        >
          02
        </div>
        <div class="space-y-4">
          <div class="text-h5">
            {{ t('values.values_section.list.2.title') }}
          </div>
          <div
            class="text-rui-text-secondary text-body-1 whitespace-break-spaces"
          >
            <i18n-t keypath="values.values_section.list.2.value" scope="global">
              <template #open_source>
                <strong>
                  {{ t('values.values_section.list.2.open_source') }}
                </strong>
              </template>
              <template #local_first>
                <strong>
                  {{ t('values.values_section.list.2.local_first') }}
                </strong>
              </template>
            </i18n-t>
          </div>
        </div>
      </div>
      <div class="hidden md:block border-t border-rui-grey-300 self-center" />
      <div class="flex gap-5 items-start">
        <div
          class="border-r-[3px] border-rui-primary pb-2.5 pr-5 text-h5 text-rui-primary"
        >
          03
        </div>
        <div class="space-y-4">
          <div class="text-h5">
            {{ t('values.values_section.list.3.title') }}
          </div>
          <div
            class="text-rui-text-secondary text-body-1 whitespace-break-spaces"
          >
            {{ t('values.values_section.list.3.value') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
