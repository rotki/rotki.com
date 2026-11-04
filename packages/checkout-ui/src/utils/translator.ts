export type MessageParams = Record<string, string | number>;

/**
 * Looks up a message by key and fills `{name}` placeholders. Same signature as the
 * part of vue-i18n's `t` the checkout uses, so either can be provided to the components.
 */
export type CheckoutTranslate = (key: string, params?: MessageParams) => string;

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Builds a translate function over a flat message map, for apps that do not run vue-i18n
 * (the card payment app). Unknown keys return the key and unknown placeholders stay as
 * written, so a missing string is visible instead of rendering blank.
 */
export function createTranslator(messages: Readonly<Record<string, string>>): CheckoutTranslate {
  return (key: string, params?: MessageParams): string => {
    const message = messages[key];
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
