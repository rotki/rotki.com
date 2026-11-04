export type MessageParams = Record<string, string | number>;

/** Nested messages addressed by dotted keys, the shape vue-i18n locale files use. */
export interface MessageTree {
  readonly [key: string]: string | MessageTree;
}

/**
 * Looks up a message by key and fills `{name}` placeholders. Same signature as the
 * part of vue-i18n's `t` the checkout uses, so either can be provided to the components.
 */
export type CheckoutTranslate = (key: string, params?: MessageParams) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

function lookup(messages: MessageTree, key: string): string | undefined {
  let node: string | MessageTree | undefined = messages;
  for (const segment of key.split('.')) {
    if (node === undefined || typeof node === 'string')
      return undefined;
    node = node[segment];
  }
  return typeof node === 'string' ? node : undefined;
}

/**
 * Builds a translate function over nested messages, for apps that do not run vue-i18n
 * (the card payment app). Unknown keys return the key and unknown placeholders stay as
 * written, so a missing string is visible instead of rendering blank.
 */
export function createTranslator(messages: MessageTree): CheckoutTranslate {
  return (key: string, params?: MessageParams): string => {
    const message = lookup(messages, key);
    if (message === undefined)
      return key;

    if (!params)
      return message;

    return message.replaceAll(PLACEHOLDER, (match: string, name: string): string => {
      const value = params[name];
      return value === undefined ? match : String(value);
    });
  };
}
