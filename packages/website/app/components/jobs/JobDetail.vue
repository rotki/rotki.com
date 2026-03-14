<script setup lang="ts">
import type { JobsLocalCollectionItem, JobsRemoteCollectionItem, MinimarkTree } from '@nuxt/content';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { assert } from '~/utils/assert';

const { data } = defineProps<{
  data: JobsLocalCollectionItem | JobsRemoteCollectionItem;
}>();

const { t } = useI18n({ useScope: 'global' });

function filterBy(filterMethod: (tag: string) => boolean) {
  return computed(() => {
    const body = data.body as any as MinimarkTree;
    assert(body.type === 'minimark');

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
      <div class="mt-8 lg:mt-0 lg:pl-16 xl:pl-24">
        <div
          v-if="data.open && sideColumn"
          class="bg-rui-primary/[.04] p-6 lg:w-[384px]"
        >
          <div class="flex">
            <div class="bg-white rounded-lg p-3 text-rui-primary">
              <RuiIcon name="lu-lightbulb" />
            </div>
          </div>
          <ContentRenderer
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
        <div
          v-if="!data.open"
          class="bg-rui-warning/[.04] p-6 lg:w-[384px]"
        >
          <div class="flex">
            <div class="bg-white rounded-lg p-3 text-rui-warning">
              <RuiIcon name="lu-info" />
            </div>
          </div>
          <div class="text-h6 font-medium mt-4 mb-2">
            {{ t('jobs.role_unavailable.title') }}
          </div>
          <p class="text-rui-text-secondary text-sm">
            {{ t('jobs.role_unavailable.description', { title: data.title }) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
