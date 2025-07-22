<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { helpers, maxLength, minLength, numeric, required } from '@vuelidate/validators';
import { useLocalStorage } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { toMessages } from '~/utils/validation';

definePageMeta({
  layout: 'sponsor',
});

const { t } = useI18n();
const route = useRoute();

const displayName = ref<string>('');
const signature = ref<string>('');
const hasSigned = ref<boolean>(false);
const isSigning = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const error = ref<string>('');
const success = ref<boolean>(false);
const imageFile = ref<File | null>(null);
const imagePreview = ref<string>('');
const tokenId = ref<string>('');
const email = ref<string>('');
const isCheckingNft = ref<boolean>(false);
const nftTier = ref<'bronze' | 'silver' | 'gold' | undefined>();
const nftCheckError = ref<string>('');
const nftReleaseId = ref<number | undefined>();
const nftReleaseName = ref<string>('');

const { connected: isConnected, address, open: connect, signMessage: signMessageWeb3 } = useWeb3Connection();

// Load NFT IDs from localStorage
const storedNftIds = useLocalStorage<number[]>('rotki-sponsor-nft-ids', []);

// Custom validators
const validNameChars = helpers.withMessage(
  () => t('sponsor.submit_name.error.invalid_chars'),
  (value: string) => !value || /^[\s\w.-]*$/.test(value),
);

const validEmail = helpers.withMessage(
  () => t('sponsor.submit_name.error.invalid_email'),
  (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
);

const validImageSize = helpers.withMessage(
  () => t('sponsor.submit_name.error.image_too_large'),
  (value: File | null) => !value || value.size <= 5 * 1024 * 1024,
);

const validImageType = helpers.withMessage(
  () => t('sponsor.submit_name.error.invalid_image_type'),
  (value: File | null) => {
    if (!value)
      return true;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(value.type);
  },
);

const atLeastOneRequired = helpers.withMessage(
  () => t('sponsor.submit_name.error.at_least_one_required'),
  () => get(displayName).trim().length > 0 || get(imageFile) !== null,
);

// Validation rules
const rules = computed(() => ({
  displayName: {
    minLength: get(displayName).trim() ? helpers.withMessage(() => t('sponsor.submit_name.error.too_short'), minLength(3)) : {},
    maxLength: helpers.withMessage(() => t('sponsor.submit_name.error.too_long'), maxLength(30)),
    validNameChars,
  },
  imageFile: {
    validImageSize,
    validImageType,
  },
  tokenId: {
    required: helpers.withMessage(() => t('sponsor.submit_name.error.token_id_required'), required),
    numeric: helpers.withMessage(() => t('sponsor.submit_name.error.token_id_invalid'), numeric),
  },
  email: {
    validEmail,
  },
  atLeastOne: {
    atLeastOneRequired,
  },
}));

const v$ = useVuelidate(rules, { displayName, imageFile, tokenId, email, atLeastOne: true }, { $autoDirty: true });

function handleImageChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    set(imageFile, file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      set(imagePreview, reader.result as string);
    };
    reader.readAsDataURL(file);

    // Reset signature when image changes
    set(hasSigned, false);
    set(signature, '');
  }
}

function removeImage(): void {
  set(imageFile, null);
  set(imagePreview, '');
  set(hasSigned, false);
  set(signature, '');
}

async function connectWallet(): Promise<void> {
  try {
    set(error, '');
    await connect();
  }
  catch {
    set(error, t('sponsor.submit_name.error.wallet_connect'));
  }
}

async function signMessage(): Promise<void> {
  try {
    set(error, '');
    set(isSigning, true);

    const message = `I am the owner of address ${get(address)}`;
    const sig = await signMessageWeb3(message);

    set(signature, sig);
    set(hasSigned, true);
  }
  catch {
    set(error, t('sponsor.submit_name.error.sign_failed'));
  }
  finally {
    set(isSigning, false);
  }
}

async function handleSubmit(): Promise<void> {
  // Validate form
  const isValid = await v$.value.$validate();

  if (!isValid) {
    return;
  }

  if (!get(hasSigned)) {
    set(error, t('sponsor.submit_name.error.sign_required'));
    return;
  }

  try {
    set(error, '');
    set(isSubmitting, true);

    // Use FormData to send both text data and file
    const formData = new FormData();
    formData.append('evm_address', get(address) || '');
    formData.append('display_name', get(displayName).trim());
    formData.append('signature', get(signature));

    const tokenIdVal = get(tokenId);
    if (tokenIdVal) {
      formData.append('nft_id', tokenIdVal);
    }

    const emailVal = get(email).trim();
    if (emailVal) {
      formData.append('email', emailVal);
    }

    const file = get(imageFile);
    if (file) {
      formData.append('image_file', file);
    }

    await fetch('webapi/nfts/holder-submission/', {
      method: 'POST',
      body: formData,
    });

    set(success, true);
  }
  catch (error_: any) {
    set(error, error_.data?.message || t('sponsor.submit_name.error.submit_failed'));
  }
  finally {
    set(isSubmitting, false);
  }
}

async function checkNftMetadata(): Promise<void> {
  const tokenIdValue = get(tokenId);
  if (!tokenIdValue || !Number.isInteger(Number(tokenIdValue))) {
    set(nftCheckError, t('sponsor.submit_name.error.invalid_token_id'));
    return;
  }

  try {
    set(isCheckingNft, true);
    set(nftCheckError, '');
    set(nftTier, undefined);
    set(nftReleaseId, undefined);
    set(nftReleaseName, '');

    // Fetch NFT metadata from the API with cache busting
    const response = await $fetch<{
      tokenId: number;
      releaseId: number;
      tierId: number;
      tier: 'bronze' | 'silver' | 'gold';
      owner: string;
      releaseName: string;
      metadata: any;
    }>(`/api/nft/${tokenIdValue}?_t=${Date.now()}`);

    if (response && response.tier) {
      set(nftTier, response.tier);
      set(nftReleaseId, response.releaseId);
      // Use release name from metadata if available, otherwise show v{releaseId}
      if (response.releaseName) {
        // If release name doesn't start with 'v', add it
        set(nftReleaseName, response.releaseName.startsWith('v') ? response.releaseName : `v${response.releaseName}`);
      }
      else {
        set(nftReleaseName, `v${response.releaseId}`);
      }
    }
    else {
      set(nftCheckError, t('sponsor.submit_name.error.nft_not_found'));
    }
  }
  catch (error: any) {
    set(nftCheckError, error.data?.message || t('sponsor.submit_name.error.check_failed'));
  }
  finally {
    set(isCheckingNft, false);
  }
}

watch([displayName, imageFile, tokenId, email], () => {
  set(hasSigned, false);
  set(signature, '');
  set(nftTier, undefined);
  set(nftReleaseId, undefined);
  set(nftReleaseName, '');
  set(nftCheckError, '');
});

onMounted(() => {
  const tokenIdParam = route.query.tokenId as string;
  if (tokenIdParam) {
    set(tokenId, tokenIdParam);
  }
});
</script>

<template>
  <section class="flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-md">
      <h1 class="mb-4 text-3xl font-bold text-center">
        {{ t('sponsor.submit_name.title') }}
      </h1>

      <p class="mb-8 text-center text-body-1 text-rui-text-secondary">
        {{ t('sponsor.submit_name.description') }}
      </p>

      <RuiCard class="!p-4">
        <form
          class="flex flex-col gap-6"
          @submit.prevent="handleSubmit()"
        >
          <div class="flex items-start gap-2">
            <RuiAutoComplete
              v-model="tokenId"
              :label="t('sponsor.submit_name.token_id_label')"
              :hint="t('sponsor.submit_name.token_id_hint')"
              :error-messages="toMessages(v$.tokenId)"
              :disabled="isSubmitting"
              :options="storedNftIds"
              clearable
              custom-value
              auto-select-first
              variant="outlined"
              color="primary"
              class="flex-1"
            />
            <RuiButton
              :disabled="!tokenId || isSubmitting"
              :loading="isCheckingNft"
              variant="outlined"
              color="primary"
              class="h-14"
              @click="checkNftMetadata()"
            >
              {{ t('sponsor.submit_name.check') }}
            </RuiButton>
          </div>
          <RuiAlert
            v-if="nftTier"
            type="info"
            class="-mt-2"
          >
            <i18n-t
              keypath="sponsor.submit_name.nft_info"
              tag="span"
            >
              <template #tokenId>
                {{ tokenId }}
              </template>
              <template #tier>
                <strong>{{ nftTier }} tier</strong>
              </template>
              <template #releaseName>
                <strong>{{ nftReleaseName }}</strong>
              </template>
            </i18n-t>
          </RuiAlert>
          <div
            v-if="nftCheckError"
            class="px-2"
          >
            <p class="text-sm text-rui-error">
              {{ nftCheckError }}
            </p>
          </div>

          <RuiTextField
            v-model="displayName"
            :label="t('sponsor.submit_name.name_label')"
            :hint="t('sponsor.submit_name.name_hint')"
            :error-messages="toMessages(v$.displayName)"
            :disabled="isSubmitting"
            variant="outlined"
            color="primary"
          />

          <div v-if="nftTier === 'silver' || nftTier === 'gold'">
            <label class="block text-sm font-medium mb-2">
              {{ t('sponsor.submit_name.image_label') }}
              <span class="text-rui-text-secondary">({{ t('sponsor.submit_name.optional') }})</span>
            </label>

            <div
              v-if="!imagePreview"
              class="relative mt-3"
            >
              <input
                id="image-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                class="hidden"
                :disabled="isSubmitting"
                @change="handleImageChange($event)"
              />
              <label
                for="image-upload"
                class="flex flex-col items-center justify-center w-full h-32 border border-dashed border-rui-grey-300 dark:border-rui-grey-600 rounded-lg cursor-pointer hover:border-rui-primary transition-colors"
              >
                <RuiIcon
                  name="lu-upload"
                  size="24"
                  class="mb-2 text-rui-text-secondary"
                />
                <span class="text-sm text-rui-text-secondary">{{ t('sponsor.submit_name.upload_image') }}</span>
                <span class="text-xs text-rui-text-disabled mt-1">{{ t('sponsor.submit_name.image_requirements') }}</span>
              </label>
            </div>
            <div
              v-else
              class="relative flex items-start"
            >
              <img
                :src="imagePreview"
                alt="Profile preview"
                class="w-32 h-32 object-cover rounded-lg mt-3"
              />
              <RuiButton
                icon
                size="sm"
                color="error"
                class="-ml-3"
                :disabled="isSubmitting"
                @click="removeImage()"
              >
                <RuiIcon
                  name="lu-x"
                  size="16"
                />
              </RuiButton>
            </div>

            <div
              v-if="toMessages(v$.imageFile).length > 0"
              class="pt-1 px-3 text-rui-error text-sm text-caption"
            >
              <p
                v-for="error in toMessages(v$.imageFile)"
                :key="error"
              >
                {{ error }}
              </p>
            </div>
            <div
              v-else
              class="pt-1 px-3 text-rui-text-secondary text-sm text-caption"
            >
              {{ nftTier === 'silver' ? t('sponsor.submit_name.image_hint_silver') : t('sponsor.submit_name.image_hint_gold') }}
            </div>
          </div>

          <RuiTextField
            v-model="email"
            :label="t('sponsor.submit_name.email_label')"
            :hint="t('sponsor.submit_name.email_hint')"
            :error-messages="toMessages(v$.email)"
            :disabled="isSubmitting"
            type="email"
            variant="outlined"
            color="primary"
          />

          <RuiTextField
            :model-value="address || ''"
            :label="t('sponsor.submit_name.address_label')"
            :hint="t('sponsor.submit_name.address_hint')"
            :disabled="true"
            variant="outlined"
            color="primary"
            readonly
          />

          <div v-if="!isConnected">
            <RuiButton
              color="primary"
              size="lg"
              class="w-full"
              @click="connectWallet()"
            >
              {{ t('sponsor.submit_name.connect_wallet') }}
            </RuiButton>
          </div>

          <div v-else-if="!hasSigned">
            <RuiButton
              color="primary"
              size="lg"
              class="w-full"
              :loading="isSigning"
              @click="signMessage()"
            >
              {{ t('sponsor.submit_name.sign_message') }}
            </RuiButton>
            <p class="mt-2 text-sm text-rui-text-secondary">
              {{ t('sponsor.submit_name.sign_hint') }}
            </p>
          </div>

          <div v-else>
            <RuiButton
              type="submit"
              color="primary"
              size="lg"
              class="w-full"
              :loading="isSubmitting"
              :disabled="v$.$invalid || !hasSigned"
            >
              {{ t('sponsor.submit_name.submit') }}
            </RuiButton>
          </div>

          <div
            v-if="error"
            class="mt-4"
          >
            <RuiAlert type="error">
              {{ error }}
            </RuiAlert>
          </div>

          <RuiAlert
            v-if="success"
            type="success"
            class="mt-4"
          >
            {{ t('sponsor.submit_name.success') }}
          </RuiAlert>
        </form>
      </RuiCard>

      <div class="mt-6 flex justify-center">
        <ButtonLink
          to="/sponsor/leaderboard"
          color="primary"
        >
          {{ t('sponsor.submit_name.view_leaderboard') }}
          <template #append>
            <RuiIcon
              name="lu-arrow-right"
              size="16"
            />
          </template>
        </ButtonLink>
      </div>
    </div>
  </section>
</template>
