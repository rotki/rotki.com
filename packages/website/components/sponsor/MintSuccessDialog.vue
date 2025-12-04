<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';
import Confetti from '~/components/common/Confetti.vue';
import { findTierByKey } from '~/composables/rotki-sponsorship/utils';
import { getTierClasses } from '~/utils/nft-tiers';

interface Props {
  selectedTier: string;
  tokenId?: string;
  releaseName?: string;
  transactionUrl?: string;
}

const showDialog = defineModel<boolean>({ required: true });

const props = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const tierLabel = computed<string | undefined>(() => findTierByKey(props.selectedTier)?.label);
</script>

<template>
  <RuiDialog
    v-model="showDialog"
    persistent
    max-width="400px"
  >
    <RuiCard content-class="!pt-0">
      <template #header>
        <div class="flex items-center gap-3">
          <RuiIcon
            name="lu-circle-check"
            class="text-rui-success"
            size="24"
          />
          <span class="text-h6 font-bold">{{ t('sponsor.sponsor_page.success_dialog.title', { id: tokenId }) }}</span>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-rui-text-secondary">
          {{ t('sponsor.sponsor_page.success_dialog.success_message', {
            tier: tierLabel,
          }) }}
        </p>
        <p
          class="font-medium px-4 py-3 rounded-lg"
          :class="getTierClasses(selectedTier)"
        >
          {{ releaseName
            ? t('sponsor.sponsor_page.success_dialog.thank_you_with_release', { release: releaseName })
            : t('sponsor.sponsor_page.success_dialog.thank_you_upcoming')
          }}
        </p>

        <div class="flex flex-col gap-3 pt-2">
          <ButtonLink
            v-if="transactionUrl"
            :to="transactionUrl"
            variant="outlined"
            color="primary"
            class="w-full"
            external
          >
            <template #prepend>
              <RuiIcon name="lu-external-link" />
            </template>
            {{ t('sponsor.sponsor_page.success_dialog.view_etherscan') }}
          </ButtonLink>

          <ButtonLink
            :to="`/sponsor/submit-name${tokenId ? `?tokenId=${tokenId}` : ''}`"
            variant="default"
            color="primary"
            class="w-full"
          >
            <template #prepend>
              <RuiIcon name="lu-user-plus" />
            </template>
            {{ t('sponsor.sponsor_page.success_dialog.request_name') }}
          </ButtonLink>

          <ButtonLink
            to="/sponsor/leaderboard"
            variant="outlined"
            color="primary"
            class="w-full"
          >
            <template #prepend>
              <RuiIcon name="lu-trophy" />
            </template>
            {{ t('sponsor.sponsor_page.success_dialog.view_leaderboard') }}
          </ButtonLink>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end w-full">
          <RuiButton
            variant="text"
            color="primary"
            @click="showDialog = false"
          >
            {{ t('sponsor.sponsor_page.success_dialog.close') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>

  <Confetti
    v-if="showDialog"
    class="absolute top-0 left-0 w-full h-full z-[10000]"
  />
</template>
