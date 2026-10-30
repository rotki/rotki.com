import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { useFormRules } from '~/composables/use-form-rules';

type Rules = ReturnType<typeof useFormRules>;

/** useFormRules reads the i18n instance, so it has to run inside a component. */
async function setup(): Promise<Rules> {
  let rules: Rules | undefined;
  await mountSuspended(defineComponent({
    setup() {
      rules = useFormRules();
      return () => h('div');
    },
  }));
  return rules!;
}

function messages(result: { success: boolean; error?: { issues: { message: string }[] } }): string[] {
  return result.success ? [] : (result.error?.issues ?? []).map(issue => issue.message);
}

describe('useFormRules', () => {
  it('treats a blank string as missing', async () => {
    const { required } = await setup();

    expect(messages(required().safeParse('   '))).toEqual(['This field is required.']);
    expect(required().safeParse('x').success).toBe(true);
  });

  it('checks the e-mail format', async () => {
    const { email } = await setup();

    expect(messages(email().safeParse('nope'))).toEqual(['Enter a valid e-mail address.']);
    expect(messages(email().safeParse(''))).toEqual(['Enter a valid e-mail address.']);
    expect(email().safeParse('someone@example.com').success).toBe(true);
  });

  it('requires 8 characters and more than digits in a password', async () => {
    const { password } = await setup();

    expect(messages(password().safeParse(''))).toContain('This field is required.');
    expect(messages(password().safeParse('abc12'))).toEqual(['Use at least 8 characters.']);
    expect(messages(password().safeParse('12345678'))).toEqual(['Use more than numbers.']);
    expect(password().safeParse('p455w0rD').success).toBe(true);
  });

  it('allows letters, digits, spaces and hyphens in a postcode', async () => {
    const { postcode } = await setup();

    expect(postcode().safeParse('ABC-40 224').success).toBe(true);
    expect(messages(postcode().safeParse('12#345'))).toEqual(['Enter a valid postal code: letters, numbers, spaces and hyphens only.']);
    expect(messages(postcode().safeParse(''))).toContain('This field is required.');
  });
});
