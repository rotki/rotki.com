<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex flex-col items-center justify-center">
    <img
      src="/img/scenery.webp"
      alt="Rotki values"
    />
  </div>
  <div class="py-10 md:py-20 bg-rui-primary/[0.04]">
    <div
      class="container grid items-start md:grid-flow-col grid-cols-1 md:grid-cols-2 md:grid-rows-[auto_3rem_auto] gap-y-10 md:gap-y-0 gap-x-20"
    >
      <div class="space-y-5">
        <div class="text-h4">
          {{ t('values.values_section.title') }}
        </div>
        <div>
          {{ t('values.values_section.description') }}
        </div>
      </div>
      <div class="border-t border-rui-grey-300 self-center" />
      <ValueBodyItem number="01">
        <template #title>
          {{ t('values.values_section.list.line_1.title') }}
        </template>
        <template #values>
          {{ t('values.values_section.list.line_1.value') }}
        </template>
      </ValueBodyItem>
      <ValueBodyItem number="02">
        <template #title>
          {{ t('values.values_section.list.line_2.title') }}
        </template>
        <template #values>
          <i18n-t
            keypath="values.values_section.list.line_2.value"
            scope="global"
          >
            <template #open_source>
              <strong>
                {{ t('values.values_section.list.line_2.open_source') }}
              </strong>
            </template>
            <template #local_first>
              <strong>
                {{ t('values.values_section.list.line_2.local_first') }}
              </strong>
            </template>
          </i18n-t>
        </template>
      </ValueBodyItem>
      <div class="hidden md:block border-t border-rui-grey-300 self-center" />
      <ValueBodyItem number="03">
        <template #title>
          {{ t('values.values_section.list.line_3.title') }}
        </template>
        <template #values>
          {{ t('values.values_section.list.line_3.value') }}
        </template>
      </ValueBodyItem>
    </div>
  </div>
</template>
