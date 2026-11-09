<script setup lang="ts">
import type { CryptoPayment } from '~/types';
import CheckoutPanel from '@rotki/checkout-ui/components/CheckoutPanel.vue';
import ChangeCryptoPayment from '~/modules/checkout/components/crypto/ChangeCryptoPayment.vue';
import CryptoAssetIcon from '~/modules/checkout/components/crypto/CryptoAssetIcon.vue';
import { type CryptoPaymentLabels, cryptoPaymentLabels } from '~/modules/checkout/utils/crypto-payment-labels';

const { data, disabled = false } = defineProps<{
  data: CryptoPayment;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  /** The buyer confirmed cancelling this payment to pick another token or network. */
  change: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const showChangePaymentDialog = ref<boolean>(false);

const labels = computed<CryptoPaymentLabels>(() => cryptoPaymentLabels(data));
</script>

<template>
  <CheckoutPanel
    aria-labelledby="crypto-asset-title"
    data-cy="crypto-asset-panel"
  >
    <div class="flex items-center justify-between gap-4">
      <h2
        id="crypto-asset-title"
        class="text-lg md:text-xl font-semibold text-rui-text"
      >
        {{ t('checkout_crypto.network_title') }}
      </h2>
      <RuiButton
        :disabled="disabled"
        variant="text"
        color="primary"
        data-cy="change-crypto-asset"
        @click="showChangePaymentDialog = true"
      >
        {{ t('actions.change') }}
      </RuiButton>
    </div>
    <div class="flex items-center gap-3">
      <CryptoAssetIcon
        :icon-url="data.iconUrl"
        :name="labels.token"
      />
      <i18n-t
        keypath="checkout_crypto.asset_on_network"
        tag="span"
      >
        <template #token>
          <strong class="font-medium">{{ labels.token }}</strong>
        </template>
        <template #network>
          {{ labels.network }}
        </template>
      </i18n-t>
    </div>
  </CheckoutPanel>

  <ChangeCryptoPayment
    v-model="showChangePaymentDialog"
    @change="emit('change')"
  />
</template>
