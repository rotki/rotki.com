<script setup lang="ts">
interface Step {
  icon: string;
  title: string;
  description: string;
  link?: { to: string; label: string };
}

const { t } = useI18n({ useScope: 'global' });

const steps = computed<Step[]>(() => [
  {
    icon: 'lu-sparkles',
    title: t('sponsor.how_it_works.mint.title'),
    description: t('sponsor.how_it_works.mint.description'),
  },
  {
    icon: 'lu-user-plus',
    title: t('sponsor.how_it_works.submit.title'),
    description: t('sponsor.how_it_works.submit.description'),
    link: { to: '/sponsor/submit-name', label: t('sponsor.how_it_works.submit.link') },
  },
  {
    icon: 'lu-trophy',
    title: t('sponsor.how_it_works.credit.title'),
    description: t('sponsor.how_it_works.credit.description'),
    link: { to: '/sponsor/leaderboard', label: t('sponsor.how_it_works.credit.link') },
  },
]);
</script>

<template>
  <section>
    <h2 class="text-h5 !font-bold text-center mb-8">
      {{ t('sponsor.how_it_works.title') }}
    </h2>
    <ol class="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
      <li
        v-for="(step, index) in steps"
        :key="step.title"
        class="rounded-2xl border border-rui-grey-200 p-6 flex flex-col gap-3"
      >
        <div class="flex items-center gap-3">
          <span class="flex items-center justify-center size-10 rounded-full bg-rui-primary/[0.08] text-rui-primary">
            <RuiIcon
              :name="step.icon"
              size="20"
            />
          </span>
          <span class="text-caption font-medium text-rui-text-secondary uppercase tracking-wider">
            {{ t('sponsor.how_it_works.step', { number: index + 1 }) }}
          </span>
        </div>
        <h3 class="text-subtitle-1 font-bold text-rui-text">
          {{ step.title }}
        </h3>
        <p class="text-body-2 text-rui-text-secondary">
          {{ step.description }}
        </p>
        <NuxtLink
          v-if="step.link"
          :to="step.link.to"
          class="mt-auto pt-1 inline-flex items-center gap-1 text-body-2 font-medium text-rui-primary hover:underline"
        >
          {{ step.link.label }}
          <RuiIcon
            name="lu-arrow-right"
            size="14"
          />
        </NuxtLink>
      </li>
    </ol>
  </section>
</template>
