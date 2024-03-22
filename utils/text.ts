/**
 *
 * @param {string} string - String to convert
 * @return {string} - String converted to title case
 * @example
 * toTitleCase('this is a sentence'); // This Is A Sentence
 */
export function toTitleCase(string: string): string {
  if (!string)
    return '';

  return string.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
