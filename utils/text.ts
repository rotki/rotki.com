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

export function secondsToReadable(number: number): string {
  const rounded = Math.floor(number);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  const messages = [];
  if (minutes > 0)
    messages.push(`${minutes} minutes`);

  if (seconds > 0)
    messages.push(`${seconds} seconds`);

  return messages.join(' ');
}
