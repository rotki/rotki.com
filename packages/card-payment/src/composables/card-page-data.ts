import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { ActiveCampaign } from '@rotki/card-payment-common/schemas/campaign';
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { AvailablePlan, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CheckoutTranslate } from '@rotki/checkout-ui/utils/translator';
import { AUTO_DISCOUNT_DISMISSED_KEY, resolveDiscountCode } from '@rotki/card-payment-common/utils/checkout';
import { findSelectedPlan, parsePlanId } from '@rotki/card-payment-common/utils/plan';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { get, set } from '@vueuse/core';
import { computed, type ComputedRef, type Ref, shallowReadonly, shallowRef } from 'vue';
import { checkout, getActiveCampaign, getAvailablePlans } from '@/utils/api';
import { getSavedCard } from '@/utils/card-api';
import { getUrlParam, navigation, replacePlanInUrl } from '@/utils/navigation';
import { canBuyNewSubscription } from '@/utils/navigation-guard';

export interface UseCardPageDataReturn {
  /** The page has nothing to show yet, or the browser is leaving for another page. */
  loading: ComputedRef<boolean>;
  /** Read out to screen readers while loading. */
  loadingMessage: Readonly<Ref<string>>;
  errorMessage: Readonly<Ref<string>>;
  upgradeSubId: Readonly<Ref<string | null>>;
  planData: Readonly<Ref<PaymentBreakdownResponse | undefined>>;
  selectedPlan: Readonly<Ref<SelectedPlan | undefined>>;
  /** The plans the buyer can switch to. */
  plans: Readonly<Ref<AvailablePlan[]>>;
  /** `undefined` until the saved cards arrive; the page renders without waiting for them. */
  cards: Readonly<Ref<SavedCard[] | undefined>>;
  account: Readonly<Ref<Account | undefined>>;
  campaign: Readonly<Ref<ActiveCampaign | undefined>>;
  /** The code the discount field starts with: explicit, then referral, then campaign. */
  initialDiscountCode: Readonly<Ref<string>>;
  /** The card to pay with, bound to the card page with v-model. */
  modelSelectedCard: Ref<SavedCard | undefined>;
  load: () => Promise<void>;
  /** Loads the saved cards again after one was added or deleted. */
  refreshCards: () => Promise<void>;
  /** Moves the order to another plan without leaving the page, so a typed card stays. */
  switchPlan: (plan: SelectedPlan) => void;
  /** Replaces the page with an error the card page could not recover from. */
  fail: (message: string) => void;
}

/** Explicit code, then referral, then campaign, unless the buyer removed an auto-applied code. */
function resolveInitialDiscountCode(activeCampaign: ActiveCampaign | undefined): string {
  return resolveDiscountCode({
    explicit: getUrlParam('discountCode') ?? undefined,
    dismissed: sessionStorage.getItem(AUTO_DISCOUNT_DISMISSED_KEY) === 'true',
    referral: getUrlParam('ref') ?? undefined,
    campaign: activeCampaign?.code,
  }) ?? '';
}

/** The plan id from the URL, or the error to show for a missing or malformed one. */
function readPlanId(t: CheckoutTranslate): { planId: number } | { error: string } {
  const planIdParam = getUrlParam('planId');
  if (!planIdParam)
    return { error: t('checkout.card_page.error_no_plan') };
  const planId = parsePlanId(planIdParam);
  if (planId === undefined)
    return { error: t('checkout.card_page.error_invalid_plan_id') };
  return { planId };
}

/**
 * Everything the card page loads before it can show: the plan id from the URL, the account
 * check, the breakdown, plans and campaign, and the saved cards. The payment data and the cards
 * load while the account is checked; the page renders without waiting for the cards.
 */
export function useCardPageData(): UseCardPageDataReturn {
  const t = useCheckoutMessages();
  const isLoading = shallowRef<boolean>(true);
  const redirecting = shallowRef<boolean>(false);
  const loadingMessage = shallowRef<string>(t('checkout.card_page.checking_account'));
  const errorMessage = shallowRef<string>('');
  const upgradeSubId = shallowRef<string | null>(null);
  const planData = shallowRef<PaymentBreakdownResponse>();
  const selectedPlan = shallowRef<SelectedPlan>();
  const plans = shallowRef<AvailablePlan[]>([]);
  const cards = shallowRef<SavedCard[]>();
  const account = shallowRef<Account>();
  const campaign = shallowRef<ActiveCampaign>();
  const initialDiscountCode = shallowRef<string>('');
  const modelSelectedCard = shallowRef<SavedCard>();

  const loading = computed<boolean>(() => get(isLoading) || get(redirecting));

  /** Stores the breakdown and plan; returns the error to show when a required piece is missing. */
  async function loadPaymentData(planId: number): Promise<string | undefined> {
    const [checkoutData, availablePlansData, activeCampaign] = await Promise.all([
      checkout(planId),
      getAvailablePlans(),
      getActiveCampaign(),
    ]);
    set(campaign, activeCampaign);
    set(initialDiscountCode, resolveInitialDiscountCode(activeCampaign));

    if (!checkoutData)
      return t('checkout.card_page.error_init');
    if (!availablePlansData)
      return t('checkout.card_page.error_plans');
    const foundPlan = findSelectedPlan(availablePlansData.tiers, planId);
    if (!foundPlan)
      return t('checkout.card_page.error_invalid_plan');

    set(planData, checkoutData);
    set(selectedPlan, foundPlan);
    set(plans, availablePlansData.tiers);
    return undefined;
  }

  /** Stores the saved cards and picks the linked one, or the first. */
  function applyCards(savedCards: SavedCard[]): void {
    set(cards, savedCards);
    set(modelSelectedCard, savedCards.find(card => card.linked) ?? savedCards[0]);
  }

  /** Saved cards come from Braintree through the backend and are the slowest call, so they load on their own. */
  function loadCards(): void {
    getSavedCard()
      .then(applyCards)
      .catch((error: unknown) => {
        console.error('Error loading saved cards:', error);
        set(cards, []);
      });
  }

  async function load(): Promise<void> {
    try {
      set(loadingMessage, t('checkout.card_page.validating_plan'));
      const plan = readPlanId(t);
      if ('error' in plan) {
        set(errorMessage, plan.error);
        return;
      }

      // A visitor who cannot buy is sent away and this data is dropped.
      const paymentData = loadPaymentData(plan.planId).catch((error: unknown) => {
        console.error('Failed to load payment data:', error);
        return t('checkout.card_page.error_generic');
      });
      loadCards();

      set(loadingMessage, t('checkout.card_page.checking_account'));
      const { canBuy, account: currentAccount } = await canBuyNewSubscription();
      const upgradeId = getUrlParam('upgradeSubId');
      set(upgradeSubId, upgradeId);
      set(account, currentAccount);

      if (!canBuy && !upgradeId) {
        set(redirecting, true);
        navigation.goToSubscription();
        return;
      }

      set(loadingMessage, t('checkout.card_page.initializing'));
      const loadError = await paymentData;
      if (loadError)
        set(errorMessage, loadError);
    }
    catch (error) {
      console.error('Initialization error:', error);
      set(errorMessage, t('checkout.card_page.error_generic'));
    }
    finally {
      set(isLoading, false);
    }
  }

  async function refreshCards(): Promise<void> {
    try {
      applyCards(await getSavedCard());
    }
    catch (error) {
      console.error('Error refreshing card:', error);
    }
  }

  function switchPlan(plan: SelectedPlan): void {
    replacePlanInUrl(plan.planId);
    set(selectedPlan, plan);
  }

  function fail(message: string): void {
    set(errorMessage, message);
  }

  return {
    account: shallowReadonly(account),
    campaign: shallowReadonly(campaign),
    cards: shallowReadonly(cards),
    errorMessage: shallowReadonly(errorMessage),
    fail,
    initialDiscountCode: shallowReadonly(initialDiscountCode),
    load,
    loading,
    loadingMessage: shallowReadonly(loadingMessage),
    modelSelectedCard,
    planData: shallowReadonly(planData),
    plans: shallowReadonly(plans),
    refreshCards,
    selectedPlan: shallowReadonly(selectedPlan),
    switchPlan,
    upgradeSubId: shallowReadonly(upgradeSubId),
  };
}
