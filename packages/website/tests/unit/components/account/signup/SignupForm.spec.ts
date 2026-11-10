import type { SignupInvoicePayload } from '~/types/signup';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { get, set } from '@vueuse/shared';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { server } from '~~/tests/mocks/server';
import SignupForm from '~/components/account/signup/SignupForm.vue';
import SignupInvoiceDetails from '~/components/account/signup/SignupInvoiceDetails.vue';

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

const EMPTY_INVOICE: SignupInvoicePayload = {
  address1: '',
  address2: '',
  city: '',
  companyName: '',
  country: '',
  firstName: '',
  lastName: '',
  newsletterConsent: false,
  postcode: '',
  vatId: '',
};

const FILLED_INVOICE: SignupInvoicePayload = {
  ...EMPTY_INVOICE,
  address1: 'Address first line',
  city: 'City',
  country: 'CT',
  firstName: 'First',
  lastName: 'Last',
  postcode: '11703',
};

/** Mounts the invoice step on its own, with the widgets that need a browser stubbed. */
async function mountInvoiceDetails() {
  return mountSuspended(SignupInvoiceDetails, {
    props: {
      email: 'email@example.com',
      externalResults: {},
      loading: false,
      modelValue: FILLED_INVOICE,
    },
    global: {
      stubs: {
        CountrySelect: true,
        Recaptcha: true,
      },
    },
  });
}

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

const InvoiceStub = defineComponent({
  emits: {
    'finish': (_recaptchaToken: string): boolean => true,
    'update:modelValue': (_value: SignupInvoicePayload): boolean => true,
  },
  setup(_, { emit }) {
    const newsletterConsent = ref<boolean>(false);

    function updateNewsletterConsent(event: Event): void {
      if (!(event.target instanceof HTMLInputElement))
        return;

      set(newsletterConsent, event.target.checked);
      emit('update:modelValue', { ...EMPTY_INVOICE, newsletterConsent: event.target.checked });
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
        'onClick': () => emit('finish', 'test-token'),
      }),
    ]);
  },
});

async function mountSignupForm() {
  const wrapper = await mountSuspended(SignupForm, {
    global: {
      stubs: {
        SignupAccount: NextStub,
        SignupAside: true,
        SignupInvoiceDetails: InvoiceStub,
      },
    },
  });

  await wrapper.get('[data-testid="next"]').trigger('click');
  await nextTick();

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

describe('signup invoice details', () => {
  it('keeps signup available when newsletter consent is unchecked', async () => {
    const wrapper = await mountInvoiceDetails();

    const newsletterConsent = wrapper.get<HTMLInputElement>('#newsletter-consent');

    expect(newsletterConsent.element.checked).toBe(false);

    await wrapper.get<HTMLInputElement>('#tos').setValue(true);
    await wrapper.get('form').trigger('submit');

    await vi.waitFor(() => {
      expect(wrapper.emitted('finish')).toHaveLength(1);
    });
  });

  it('does not submit until the terms are accepted', async () => {
    const wrapper = await mountInvoiceDetails();

    await wrapper.get('form').trigger('submit');

    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Accept the terms to create your account.');
    });
    expect(wrapper.emitted('finish')).toBeUndefined();
  });
});
