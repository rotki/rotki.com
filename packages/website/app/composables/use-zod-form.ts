import type { ComputedRef, MaybeRefOrGetter } from 'vue';
import type { z } from 'zod';
import { get, set } from '@vueuse/shared';

/** Errors per field as the backend returns them: one message or a list. */
export type FieldErrors = Record<string, string[] | string | undefined>;

export interface ZodFormOptions {
  /**
   * Shows a field's errors once its value changes. Turn it off to wait for `touch` (on blur) or
   * `validate` (on submit) instead. Defaults to true.
   */
  touchOnChange?: boolean;
}

export interface ZodForm<Field extends string> {
  /** The messages to show for a field: its schema errors once touched, plus any backend errors. */
  errors: (field: Field) => string[];
  hasError: (field: Field) => boolean;
  /** Only the backend errors for a field, for places that show the schema rules another way. */
  serverErrors: (field: Field) => string[];
  /** True while the schema rejects the state or a backend error is still standing. */
  invalid: ComputedRef<boolean>;
  /** True once `validate` ran, so a form can hold back hints until the first submit. */
  submitted: Readonly<Ref<boolean>>;
  touch: (field: Field) => void;
  /** Touches every field and reports whether the form can be sent. */
  validate: () => boolean;
  /** Forgets touched fields, the submit and backend errors, for example after loading saved values. */
  reset: () => void;
  /** Shows backend errors under their fields until the user changes that field. */
  setExternalErrors: (errors: FieldErrors) => void;
}

function toList(messages: string[] | string | undefined): string[] {
  if (!messages)
    return [];
  return (Array.isArray(messages) ? messages : [messages]).filter(message => message.length > 0);
}

/**
 * Validates a form's state against a zod schema and tracks which fields to show errors for.
 *
 * @param schema - The schema, or a getter for one whose rules depend on other state.
 * @param state - The values: a ref, a reactive object or a getter that builds them.
 * @param options - When to start showing a field's errors.
 */
type FormSchema = z.ZodType<Record<string, unknown>, Record<string, unknown>>;

export function useZodForm<Schema extends FormSchema, Field extends string = Extract<keyof z.input<Schema>, string>>(
  schema: MaybeRefOrGetter<Schema>,
  state: MaybeRefOrGetter<z.input<Schema>>,
  { touchOnChange = true }: ZodFormOptions = {},
): ZodForm<Field> {
  const touched = ref<Record<string, boolean>>({});
  const external = ref<Record<string, string[]>>({});
  const submitted = shallowRef<boolean>(false);

  const issues = computed<Record<string, string[]>>(() => {
    const result = toValue(schema).safeParse(toValue(state));
    if (result.success)
      return {};

    const byField: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      // Form-level refinements have an empty path; they block `invalid` but belong to no field.
      const field = String(issue.path[0] ?? '');
      (byField[field] ??= []).push(issue.message);
    }
    return byField;
  });

  const invalid = computed<boolean>(() =>
    Object.keys(get(issues)).length > 0 || Object.values(get(external)).some(messages => messages.length > 0));

  function serverErrors(field: Field): string[] {
    return get(external)[field] ?? [];
  }

  function errors(field: Field): string[] {
    const own = get(touched)[field] ? (get(issues)[field] ?? []) : [];
    return [...own, ...serverErrors(field)];
  }

  function hasError(field: Field): boolean {
    return errors(field).length > 0;
  }

  function touch(field: Field): void {
    set(touched, { ...get(touched), [field]: true });
  }

  function validate(): boolean {
    set(submitted, true);
    const all: Record<string, boolean> = {};
    for (const field of Object.keys(toValue(state)))
      all[field] = true;
    set(touched, all);
    return !get(invalid);
  }

  function reset(): void {
    set(touched, {});
    set(external, {});
    set(submitted, false);
  }

  function setExternalErrors(fieldErrors: FieldErrors): void {
    const next: Record<string, string[]> = {};
    for (const [field, messages] of Object.entries(fieldErrors))
      next[field] = toList(messages);
    set(external, next);
  }

  // A changed field drops its backend error and, by default, starts showing its own errors.
  watch(() => ({ ...toValue(state) }), (current, previous) => {
    const changed = Object.keys(current).filter(field => !Object.is(current[field], previous[field]));
    if (changed.length === 0)
      return;

    const remaining = { ...get(external) };
    for (const field of changed)
      delete remaining[field];
    set(external, remaining);

    if (touchOnChange) {
      const next = { ...get(touched) };
      for (const field of changed)
        next[field] = true;
      set(touched, next);
    }
  }, { flush: 'sync' });

  return {
    errors,
    hasError,
    invalid,
    reset,
    serverErrors,
    setExternalErrors,
    submitted: shallowReadonly(submitted),
    touch,
    validate,
  };
}
