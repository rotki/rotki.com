import type { SignupAddressPayload } from '~/types/signup';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { get, set } from '@vueuse/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { server } from '~~/tests/mocks/server';
import SignupAddress from '~/components/account/signup/SignupAddress.vue';
import SignupForm from '~/components/account/signup/SignupForm.vue';

vi.mock('~/composables/chronicling/use-sigil-events', () => ({
  useSigilEvents: () => ({
    chronicle: vi.fn(),
  }),
}));

vi.mock('~/composables/use-recaptcha', () => ({
  useRecaptcha: () => ({
    modelCaptchaId: ref<number>(),
    onError: vi.fn(),
    onExpired: vi.fn(),
    onSuccess: vi.fn(),
    recaptchaPassed: ref<boolean>(true),
    recaptchaToken: ref<string>('test-token'),
    resetCaptcha: vi.fn(),
  }),
}));

vi.mock('~/composables/use-redirect-url', () => ({
  useRedirectUrl: () => ({
    saveRedirectUrl: vi.fn(),
  }),
}));

const NextStub = defineComponent({
  emits: {
    next: (): boolean => true,
  },
  setup(_, { emit }) {
    return () => h('button', {
      'data-testid': 'next',
      'onClick': () => emit('next'),
    });
  },
});

const AddressStub = defineComponent({
  emits: {
    'finish': (_events: {
      recaptchaToken: string;
      onExpired: () => void;
    }): boolean => true,
    'update:modelValue': (_value: SignupAddressPayload): boolean => true,
  },
  setup(_, { emit }) {
    const newsletterConsent = ref<boolean>(false);

    function updateNewsletterConsent(event: Event): void {
      if (!(event.target instanceof HTMLInputElement))
        return;

      set(newsletterConsent, event.target.checked);
      emit('update:modelValue', {
        address1: '',
        address2: '',
        city: '',
        country: '',
        newsletterConsent: event.target.checked,
        postcode: '',
      });
    }

    return () => h('div', [
      h('input', {
        'checked': get(newsletterConsent),
        'data-testid': 'newsletter-consent',
        'onChange': updateNewsletterConsent,
        'type': 'checkbox',
      }),
      h('button', {
        'data-testid': 'finish',
        'onClick': () => emit('finish', {
          recaptchaToken: 'test-token',
          onExpired: vi.fn(),
        }),
      }),
    ]);
  },
});

async function mountSignupForm() {
  const wrapper = await mountSuspended(SignupForm, {
    global: {
      stubs: {
        RuiFooterStepper: true,
        RuiStepper: true,
        SignupAccount: NextStub,
        SignupAddress: AddressStub,
        SignupCustomerInformation: NextStub,
        SignupIntroduction: NextStub,
      },
    },
  });

  for (let step = 1; step < 4; step++) {
    await wrapper.get('[data-testid="next"]').trigger('click');
    await nextTick();
  }

  return wrapper;
}

describe('signup form', () => {
  it.each([
    { checked: false, expected: false },
    { checked: true, expected: true },
  ])('submits newsletter_consent as $expected when checked is $checked', async ({ checked, expected }) => {
    let requestBody: Record<string, unknown> | undefined;
    const { BACKEND_URL } = import.meta.env;

    server.use(
      http.post(`${BACKEND_URL}/webapi/signup/`, async ({ request }) => {
        const body: unknown = await request.json();
        if (typeof body === 'object' && body !== null)
          requestBody = Object.fromEntries(Object.entries(body));
        return HttpResponse.json({ result: false });
      }),
    );

    const wrapper = await mountSignupForm();
    const newsletterConsent = wrapper.get<HTMLInputElement>('[data-testid="newsletter-consent"]');

    expect(newsletterConsent.element.checked).toBe(false);

    await newsletterConsent.setValue(checked);

    await wrapper.get('[data-testid="finish"]').trigger('click');

    await vi.waitFor(() => {
      expect(requestBody).toMatchObject({
        newsletter_consent: expected,
      });
    });
  });
});

describe('signup address', () => {
  it('keeps signup available when newsletter consent is unchecked', async () => {
    const wrapper = await mountSuspended(SignupAddress, {
      props: {
        externalResults: {},
        loading: false,
        modelValue: {
          address1: 'Address first line',
          address2: '',
          city: 'City',
          country: 'CT',
          newsletterConsent: false,
          postcode: '11703',
        },
      },
      global: {
        stubs: {
          CountrySelect: true,
          Recaptcha: true,
        },
      },
    });

    const newsletterConsent = wrapper.get<HTMLInputElement>('#newsletter-consent');
    const submitButton = wrapper.get<HTMLButtonElement>('[data-cy="submit-button"]');

    expect(newsletterConsent.element.checked).toBe(false);

    await wrapper.get<HTMLInputElement>('#tos').setValue(true);

    expect(submitButton.element.disabled).toBe(false);
  });
});
