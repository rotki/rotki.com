<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type {
  CryptoPaymentState,
  OperationState,
  SubscriptionActionEvent,
  SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import { isCancelledButActive } from '@rotki/card-payment-common';
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import PlanLimitsList from '~/components/account/home/PlanLimitsList.vue';
import SubscriptionActionsCell from '~/components/account/home/subscription-table/SubscriptionActionsCell.vue';
import SubscriptionBillingSection from '~/components/account/home/SubscriptionBillingSection.vue';
import SubscriptionDialogs from '~/components/account/home/SubscriptionDialogs.vue';
import SubscriptionInfoField from '~/components/account/home/SubscriptionInfoField.vue';
import { useSubscriptionOperations } from '~/composables/use-subscription-operations';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { useTiersStore } from '~/store/tiers';
import { formatDate } from '~/utils/date';

interface Props {
  subscription: UserSubscription;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useI18n({ useScope: 'global' });
const { actionsClasses } = useSubscriptionDisplay();
const { canUpgradeSubscription } = useSubscriptionActions();

// Subscription status display and styling
const subscriptionRef = toRef(props, 'subscription');
const { statusDisplayText, statusCardClass } = useSubscriptionStatus(subscriptionRef);

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

const tiersStore = useTiersStore();
const { availablePlans } = storeToRefs(tiersStore);

// Unified action state
const activeAction = ref<SubscriptionActionType>();
const activeActionSubscription = ref<UserSubscription>();

// Computed for renewableSubscriptions
const renewableSubscriptions = computed<UserSubscription[]>(() =>
  props.subscription.actions.includes('renew') ? [props.subscription] : [],
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
  computed<Date>(() => new Date(props.subscription.createdDate)),
);

const nextActionRelative = useTimeAgo(
  computed<Date>(() => new Date(props.subscription.nextActionDate)),
);

// Check if upgrade is available
const isUpgradeAvailable = computed<boolean>(() => canUpgradeSubscription(props.subscription, get(availablePlans)));

// Action handlers using centralized composable
async function resumeSubscription(subscription: UserSubscription): Promise<void> {
  await performResumeSubscription(subscription, activeAction, activeActionSubscription);
}

async function cancelSubscription(subscription: UserSubscription): Promise<void> {
  await performCancelSubscription(subscription, activeAction, activeActionSubscription);
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
  <div>
    <RuiCard :class="statusCardClass">
      <!-- Prominent Next Billing Section (if applicable) -->
      <SubscriptionBillingSection
        v-if="subscription.nextBillingAmount || isCancelledButActive(subscription)"
        :subscription="subscription"
        :formatted-date="formatDate(subscription.nextActionDate)"
        :relative-time="nextActionRelative"
      />

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Subscription Info -->
        <div class="space-y-4">
          <SubscriptionInfoField
            icon="lu-package"
            :label="t('account.subscriptions.plan')"
            value-class="font-medium"
          >
            <div class="flex items-center gap-2">
              <span>{{ planDisplayName }}</span>
              <RuiChip
                v-if="isUpgradeAvailable"
                size="sm"
                color="primary"
              >
                <div class="flex items-center gap-1">
                  <RuiIcon
                    name="lu-sparkles"
                    size="14"
                  />
                  {{ t('account.subscriptions.upgrade_available') }}
                </div>
              </RuiChip>
            </div>
          </SubscriptionInfoField>

          <SubscriptionInfoField
            icon="lu-calendar-plus"
            :label="t('account.subscriptions.created_date')"
            :value="formatDate(subscription.createdDate)"
            :subtitle="createdRelative"
          />

          <SubscriptionInfoField
            icon="lu-info"
            :label="t('common.status')"
            :value="statusDisplayText"
            value-class="font-medium"
          />

          <!-- Only show Next Action Date if not already shown in Next Billing section -->
          <SubscriptionInfoField
            v-if="!subscription.nextBillingAmount"
            icon="lu-calendar-clock"
            :label="t('account.subscriptions.next_action_date')"
            :value="formatDate(subscription.nextActionDate)"
            :subtitle="nextActionRelative"
          />
        </div>

        <!-- Plan Limits & Actions -->
        <div class="space-y-4">
          <PlanLimitsList :limits="planLimits" />

          <div>
            <div class="flex items-center gap-2 text-rui-text-secondary text-sm mb-2">
              <RuiIcon
                name="lu-settings"
                size="16"
              />
              <span class="capitalize">{{ t('common.actions') }}</span>
            </div>
            <SubscriptionActionsCell
              :subscription="subscription"
              :actions-classes="actionsClasses"
              :available-plans="availablePlans"
              :operation-state="operationState"
              :crypto-payment-state="cryptoPaymentState"
              layout="horizontal"
              @action="handleSubscriptionAction($event)"
            />
          </div>
        </div>
      </div>

      <!-- Action Dialogs -->
      <SubscriptionDialogs
        v-model="activeActionSubscription"
        :active-action="activeAction"
        :in-progress="inProgress"
        :operation-type="operationType"
        @cancel-subscription="cancelSubscription($event)"
        @resume-subscription="resumeSubscription($event)"
        @cancel-upgrade="cancelUpgrade($event)"
      />
    </RuiCard>
  </div>
</template>
