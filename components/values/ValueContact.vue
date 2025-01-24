<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

const { t } = useI18n();

const {
  public: {
    contact: { emailMailto, email, twitter, discord, github },
  },
} = useRuntimeConfig();

const contacts: { title: string; description: string; href: string; icon: RuiIcons; linkLabel?: string }[] = [
  {
    title: 'Email',
    description: t('values.contact_section.email.description'),
    href: emailMailto,
    icon: 'lu-mail',
    linkLabel: email,
  },
  {
    title: 'Twitter',
    description: t('values.contact_section.twitter.description'),
    href: twitter,
    icon: 'lu-x-twitter',
    linkLabel: '@RotkiApp',
  },
  {
    title: 'Discord',
    description: t('values.contact_section.discord.description'),
    href: discord,
    icon: 'lu-discord',
  },
  {
    title: 'Github',
    description: t('values.contact_section.github.description'),
    href: github,
    icon: 'lu-github',
    linkLabel: 'Rotki Solutions GmbH',
  },
];
</script>

<template>
  <div class="py-10 md:py-20">
    <div class="container space-y-10 md:space-y-16">
      <div>
        <div class="text-h6 text-rui-primary mb-3">
          {{ t('values.contact_section.title') }}
        </div>
        <div class="text-h4 mb-4">
          {{ t('values.contact_section.header') }}
        </div>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('values.contact_section.subtitle') }}
        </div>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="contact in contacts"
          :key="contact.title"
          class="p-6 bg-rui-primary/[0.04] space-y-4"
        >
          <div
            class="w-12 h-12 rounded-[10px] bg-rui-primary text-white flex items-center justify-center"
          >
            <RuiIcon :name="contact.icon" />
          </div>
          <div class="space-y-5">
            <div class="space-y-2">
              <div class="text-h6">
                {{ contact.title }}
              </div>
              <div class="text-body-1 text-rui-text-secondary">
                {{ contact.description }}
              </div>
            </div>
            <div class="-ml-1">
              <ButtonLink
                external
                :to="contact.href"
                inline
                color="primary"
              >
                {{ contact.linkLabel ?? contact.href }}
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
