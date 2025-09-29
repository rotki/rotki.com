/**
 * Object utilities for transforming API response keys between snake_case and camelCase
 * Shared between card-payment and website packages
 */

export function isObject(data: any): boolean {
  return typeof data === 'object'
    && data !== null
    && !(data instanceof RegExp)
    && !(data instanceof Error)
    && !(data instanceof Date);
}

export function getUpdatedKey(key: string, camelCase: boolean): string {
  if (camelCase) {
    return key.includes('_')
      ? key.replace(/_(.)/gu, (_, p1) => p1.toUpperCase())
      : key;
  }

  return key
    .replace(/([A-Z])/gu, (_, p1, offset, string) => {
      const nextCharOffset = offset + 1;
      if (
        (nextCharOffset < string.length
          && /[A-Z]/.test(string[nextCharOffset]))
        || nextCharOffset === string.length
      ) {
        return p1;
      }

      return `_${p1.toLowerCase()}`;
    })
    .replace(/(\d)/gu, (_, p1, offset, string) => {
      const previousOffset = offset - 1;
      if (previousOffset >= 0 && /\d/.test(string[previousOffset]))
        return p1;

      return `_${p1.toLowerCase()}`;
    });
}

export function convertKeys(data: any, camelCase: boolean, skipKey: boolean): any {
  if (Array.isArray(data))
    return data.map(entry => convertKeys(entry, camelCase, false));

  if (!isObject(data))
    return data;

  const converted: { [key: string]: any } = {};
  for (const key in data) {
    const datum = data[key];
    const updatedKey = skipKey ? key : getUpdatedKey(key, camelCase);

    converted[updatedKey] = isObject(datum)
      ? convertKeys(datum, camelCase, skipKey && key === 'result')
      : datum;
  }
  return converted;
}
