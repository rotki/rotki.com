<script setup lang="ts">
import type { JobsLocalCollectionItem, JobsRemoteCollectionItem, MinimalTree } from '@nuxt/content';

const props = defineProps<{
  data: JobsLocalCollectionItem | JobsRemoteCollectionItem;
}>();

function filterBy(filterMethod: (tag: string) => boolean) {
  return computed(() => {
    const data = props.data;
    const body = data.body as any as MinimalTree;
    assert(body.type === 'minimal');

    const elements = body.value.filter(node => filterMethod(node[0]));

    if (elements.length === 0) {
      return undefined;
    }

    return {
      ...data,
      body: {
        ...body,
        value: elements,
      },
    };
  });
}

const mainColumn = filterBy(tag => tag !== 'blockquote');
const sideColumn = filterBy(tag => tag === 'blockquote');

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="py-8 lg:py-20">
    <div class="container flex flex-col lg:flex-row">
      <div class="grow">
        <ContentRenderer
          v-if="mainColumn"
          :value="mainColumn"
        />
      </div>
      <div
        v-if="sideColumn"
        class="mt-8 lg:mt-0 lg:pl-16 xl:pl-24"
      >
        <div class="bg-rui-primary/[.04] p-6 lg:w-[384px]">
          <div class="flex">
            <div class="bg-white rounded-lg p-3 text-rui-primary">
              <RuiIcon name="lu-lightbulb" />
            </div>
          </div>
          <ContentRenderer
            v-if="sideColumn"
            :value="sideColumn"
          />
          <ButtonLink
            to="mailto:careers@rotki.com"
            external
            color="primary"
            variant="default"
          >
            {{ t('actions.apply') }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
