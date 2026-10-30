<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { CancelSubscriptionConfirmEvent } from '~/components/account/home/CancelSubscription.vue';
import type {
  CryptoPaymentState,
  OperationState,
  SubscriptionActionEvent,
  SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import { isCancelledButActive } from '@rotki/card-payment-common/utils/subscription';
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import PlanLimitsList from '~/components/account/home/PlanLimitsList.vue';
import SubscriptionActionsCell from '~/components/account/home/subscription-table/SubscriptionActionsCell.vue';
import SubscriptionBillingSection from '~/components/account/home/SubscriptionBillingSection.vue';
import SubscriptionDialogs from '~/components/account/home/SubscriptionDialogs.vue';
import SubscriptionPlanName from '~/components/account/home/SubscriptionPlanName.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSubscriptionCryptoPayment } from '~/composables/subscription/use-subscription-crypto-payment';
import { useSubscriptionOperations } from '~/composables/subscription/use-subscription-operations';
import { useSubscriptionPlanInfo } from '~/composables/subscription/use-subscription-plan-info';
import { useSubscriptionStatus } from '~/composables/subscription/use-subscription-status';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { formatDate } from '~/utils/date';

const { subscription } = defineProps<{
  subscription: UserSubscription;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useI18n({ useScope: 'global' });

// Subscription status display and styling
const subscriptionRef = toRef(() => subscription);
const { statusDisplayText, statusColor } = useSubscriptionStatus(subscriptionRef);

// Plan information and limits
const { planLimits, planDisplayName } = useSubscriptionPlanInfo(subscriptionRef);

// Use centralized subscription operations composable
const {
  resumeSubscription: performResumeSubscription,
  cancelSubscription: performCancelSubscription,
  cancelUpgrade: performCancelUpgrade,
} = useSubscriptionOperations({
  onActionComplete: async () => {
    emit('refresh');
  },
});

// Store setup
const subscriptionOpsStore = useSubscriptionOperationsStore();
const {
  inProgress,
  operationType,
  status,
} = storeToRefs(subscriptionOpsStore);

const { availablePlans } = useAvailablePlans();

// Unified action state
const activeAction = ref<SubscriptionActionType>();
const activeActionSubscription = ref<UserSubscription>();

// Computed for renewableSubscriptions
const renewableSubscriptions = computed<UserSubscription[]>(() =>
  subscription.actions.includes('renew') ? [subscription] : [],
);

// Crypto payment composable
const {
  pendingTx,
  renewLink,
} = useSubscriptionCryptoPayment({
  renewableSubscriptions,
});

// Grouped state for SubscriptionActionsCell
const operationState = computed<OperationState>(() => ({
  inProgress: get(inProgress),
  operationType: get(operationType),
  status: get(status),
  activeAction: get(activeAction),
  activeSubscription: get(activeActionSubscription),
}));

const cryptoPaymentState = computed<CryptoPaymentState>(() => ({
  pendingTx: get(pendingTx),
  renewLink: get(renewLink),
}));

// Relative date calculations using VueUse
const createdRelative = useTimeAgo(
  computed<Date>(() => new Date(subscription.createdDate)),
);

const nextActionRelative = useTimeAgo(
  computed<Date>(() => new Date(subscription.nextActionDate)),
);

async function resumeSubscription(subscription: UserSubscription): Promise<void> {
  await performResumeSubscription(subscription, activeAction, activeActionSubscription);
}

async function cancelSubscription({ subscription, feedback }: CancelSubscriptionConfirmEvent): Promise<void> {
  await performCancelSubscription(subscription, activeAction, activeActionSubscription, feedback);
}

async function cancelUpgrade(subscriptionId: string): Promise<void> {
  await performCancelUpgrade(subscriptionId, activeAction, activeActionSubscription);
}

function handleSubscriptionAction({ action, subscription }: SubscriptionActionEvent): void {
  set(activeAction, action);
  set(activeActionSubscription, subscription);
}
</script>

<template>
  <div class="rounded-lg border border-default p-5 md:p-7 flex flex-col gap-7">
    <div class="min-w-0 flex flex-col gap-6">
      <div class="flex flex-wrap items-center gap-3">
        <h3 class="text-h5 text-rui-text">
          <SubscriptionPlanName
            :subscription="subscription"
            :plan-name="planDisplayName"
            :available-plans="availablePlans"
          />
        </h3>
        <RuiChip
          size="sm"
          variant="tonal"
          :color="statusColor"
        >
          {{ statusDisplayText }}
        </RuiChip>
      </div>

      <div class="flex flex-wrap gap-x-12 gap-y-5">
        <SubscriptionBillingSection
          v-if="subscription.nextBillingAmount || isCancelledButActive(subscription)"
          :subscription="subscription"
          :formatted-date="formatDate(subscription.nextActionDate)"
          :relative-time="nextActionRelative"
        />
        <div v-else>
          <p class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
            {{ t('account.subscriptions.next_action_date') }}
          </p>
          <p class="mt-1 text-body-1 text-rui-text">
            {{ formatDate(subscription.nextActionDate) }}
          </p>
          <p class="mt-0.5 text-body-2 text-rui-text-secondary">
            {{ nextActionRelative }}
          </p>
        </div>
        <div>
          <p class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
            {{ t('account.subscriptions.created_date') }}
          </p>
          <p class="mt-1 text-body-1 text-rui-text">
            {{ formatDate(subscription.createdDate) }}
          </p>
          <p class="mt-0.5 text-body-2 text-rui-text-secondary">
            {{ createdRelative }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <SubscriptionActionsCell
          :subscription="subscription"
          actions-classes=""
          :available-plans="availablePlans"
          :operation-state="operationState"
          :crypto-payment-state="cryptoPaymentState"
          layout="horizontal"
          prominent
          @action="handleSubscriptionAction($event)"
        />
        <ButtonLink
          to="/home/billing"
          color="primary"
          variant="text"
        >
          {{ t('account.overview.manage_billing') }}
        </ButtonLink>
      </div>
    </div>

    <div
      v-if="planLimits.length > 0"
      class="rounded-lg bg-rui-grey-50 dark:bg-rui-grey-900 p-5"
    >
      <PlanLimitsList :limits="planLimits" />
    </div>
  </div>

  <SubscriptionDialogs
    v-model="activeActionSubscription"
    :active-action="activeAction"
    :in-progress="inProgress"
    :operation-type="operationType"
    @cancel-subscription="cancelSubscription($event)"
    @resume-subscription="resumeSubscription($event)"
    @cancel-upgrade="cancelUpgrade($event)"
  />
</template>
