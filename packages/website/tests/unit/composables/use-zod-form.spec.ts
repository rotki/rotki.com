import { get, set } from '@vueuse/shared';
import { describe, expect, it } from 'vitest';
import { reactive, ref } from 'vue';
import { z } from 'zod';
import { useZodForm } from '~/composables/use-zod-form';

const schema = z.object({
  name: z.string().min(1, { error: 'name required' }),
  password: z.string().min(8, { error: 'too short' }),
  confirm: z.string(),
}).refine(value => value.password === value.confirm, { path: ['confirm'], error: 'differs' });

function setup(options?: { touchOnChange?: boolean }) {
  const state = reactive({ name: '', password: '', confirm: '' });
  return { form: useZodForm(schema, state, options), state };
}

describe('useZodForm', () => {
  it('hides errors of untouched fields but still reports the form invalid', () => {
    const { form } = setup();

    expect(form.errors('name')).toEqual([]);
    expect(get(form.invalid)).toBe(true);
  });

  it('shows a field error once that field changes', () => {
    const { form, state } = setup();

    state.password = 'short';

    expect(form.errors('password')).toEqual(['too short']);
    expect(form.errors('name')).toEqual([]);
  });

  it('waits for touch or validate when touchOnChange is off', () => {
    const { form, state } = setup({ touchOnChange: false });

    state.password = 'short';
    expect(form.errors('password')).toEqual([]);

    form.touch('password');
    expect(form.errors('password')).toEqual(['too short']);
  });

  it('touches every field on validate and reports the result', () => {
    const { form, state } = setup();

    expect(form.validate()).toBe(false);
    expect(get(form.submitted)).toBe(true);
    expect(form.errors('name')).toEqual(['name required']);

    state.name = 'someone';
    state.password = 'p455w0rD';
    state.confirm = 'p455w0rD';
    expect(form.validate()).toBe(true);
  });

  it('puts refinements with a path under that field', () => {
    const { form, state } = setup();

    state.password = 'p455w0rD';
    state.confirm = 'other';

    expect(form.errors('confirm')).toEqual(['differs']);
  });

  it('shows backend errors until the field changes', () => {
    const { form, state } = setup();
    state.name = 'taken';

    form.setExternalErrors({ name: 'already in use', password: ['too common'] });
    expect(form.errors('name')).toEqual(['already in use']);
    expect(form.hasError('password')).toBe(true);
    expect(get(form.invalid)).toBe(true);

    state.name = 'free';
    expect(form.errors('name')).toEqual([]);
    expect(form.errors('password')).toEqual(['too common']);
  });

  it('forgets touched fields, submit and backend errors on reset', () => {
    const { form, state } = setup();
    state.password = 'short';
    form.validate();
    form.setExternalErrors({ name: 'already in use' });

    form.reset();

    expect(form.errors('password')).toEqual([]);
    expect(form.errors('name')).toEqual([]);
    expect(get(form.submitted)).toBe(false);
  });

  it('follows a schema getter whose rules depend on other state', () => {
    const optional = ref<boolean>(false);
    const state = reactive({ name: '' });
    const form = useZodForm(() => z.object({ name: get(optional) ? z.string() : z.string().min(1) }), state);

    expect(get(form.invalid)).toBe(true);
    set(optional, true);
    expect(get(form.invalid)).toBe(false);
  });
});
