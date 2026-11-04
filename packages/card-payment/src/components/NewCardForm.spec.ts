import type { Client } from 'braintree-web/client';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { create } from 'braintree-web/hosted-fields';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NewCardForm from './NewCardForm.vue';

type FieldKey = 'number' | 'expirationDate' | 'cvv';

type Handler = (event: { emittedBy: FieldKey; fields: Record<FieldKey, { isValid: boolean }> }) => void;

const fields = vi.hoisted(() => ({
  handlers: new Map<string, (event: unknown) => void>(),
  setAttribute: vi.fn(),
  removeAttribute: vi.fn(),
  tokenize: vi.fn(async () => ({ nonce: 'card-nonce', details: { bin: '411111' } })),
  teardown: vi.fn(async () => {}),
}));

vi.mock('braintree-web/hosted-fields', () => ({
  create: vi.fn(async () => ({
    on: (name: string, handler: (event: unknown) => void) => fields.handlers.set(name, handler),
    setAttribute: fields.setAttribute,
    removeAttribute: fields.removeAttribute,
    tokenize: fields.tokenize,
    teardown: fields.teardown,
  })),
}));

const client: Client = { authorization: 'client-token', getConfiguration: vi.fn(), request: vi.fn(), teardown: vi.fn() };

function fire(name: string, emittedBy: FieldKey, valid: Partial<Record<FieldKey, boolean>> = {}): void {
  const handler: Handler | undefined = fields.handlers.get(name);
  handler?.({
    emittedBy,
    fields: {
      number: { isValid: valid.number ?? false },
      expirationDate: { isValid: valid.expirationDate ?? false },
      cvv: { isValid: valid.cvv ?? false },
    },
  });
}

async function mountForm(disabled = false): Promise<VueWrapper<InstanceType<typeof NewCardForm>>> {
  const wrapper = mount(NewCardForm, { props: { client, disabled } });
  await flushPromises();
  return wrapper;
}

/** The classes of the label above a field, found by its text. */
function label(wrapper: VueWrapper, text: string): string {
  const found = wrapper.findAll('span.block').find(span => span.text() === text);
  return found?.classes().join(' ') ?? '';
}

describe('components/NewCardForm', () => {
  beforeEach(() => {
    fields.handlers.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mounts Braintree\'s three card fields into their containers', async () => {
    const wrapper = await mountForm();

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      client,
      fields: {
        number: { container: '#card-number' },
        cvv: { container: '#cvv' },
        expirationDate: { container: '#expiration', placeholder: 'MM / YY' },
      },
    }));
    expect(wrapper.text()).toContain('Card number');
    expect(wrapper.text()).toContain('Expiry date');
    expect(wrapper.text()).toContain('CVV');
  });

  it('reports the form valid only once every field is', async () => {
    const wrapper = await mountForm();
    expect(wrapper.emitted('validation-change')).toEqual([[false]]);

    fire('validityChange', 'number', { number: true });
    fire('validityChange', 'expirationDate', { number: true, expirationDate: true });
    await flushPromises();
    expect(wrapper.emitted('validation-change')).toEqual([[false]]);

    fire('validityChange', 'cvv', { number: true, expirationDate: true, cvv: true });
    await flushPromises();
    expect(wrapper.emitted('validation-change')).toEqual([[false], [true]]);
  });

  it('marks an invalid field only after the buyer has left it', async () => {
    const wrapper = await mountForm();

    fire('focus', 'number');
    await flushPromises();
    expect(label(wrapper, 'Card number')).not.toContain('text-rui-error');

    fire('blur', 'number');
    await flushPromises();
    expect(label(wrapper, 'Card number')).toContain('text-rui-error');

    fire('validityChange', 'number', { number: true });
    await flushPromises();
    expect(label(wrapper, 'Card number')).not.toContain('text-rui-error');
  });

  it('locks and unlocks the fields with the form', async () => {
    const wrapper = await mountForm();

    await wrapper.setProps({ disabled: true });
    expect(fields.setAttribute).toHaveBeenCalledTimes(3);
    expect(fields.setAttribute).toHaveBeenCalledWith({ field: 'cvv', attribute: 'disabled', value: true });

    await wrapper.setProps({ disabled: false });
    expect(fields.removeAttribute).toHaveBeenCalledWith({ field: 'number', attribute: 'disabled' });
  });

  it('tokenizes the card into a nonce and its BIN', async () => {
    const wrapper = await mountForm();

    await expect(wrapper.vm.tokenize()).resolves.toEqual({ nonce: 'card-nonce', bin: '411111' });
  });

  it('reports when Braintree cannot set the fields up', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(create).mockRejectedValueOnce(new Error('bad token'));
    const wrapper = await mountForm();

    expect(wrapper.emitted('error')).toEqual([['Failed to initialize payment form: bad token']]);
    await expect(wrapper.vm.tokenize()).rejects.toThrow('Hosted fields not initialized');
  });

  it('tears the fields down when it goes away', async () => {
    const wrapper = await mountForm();

    wrapper.unmount();
    await flushPromises();

    expect(fields.teardown).toHaveBeenCalledOnce();
  });
});
