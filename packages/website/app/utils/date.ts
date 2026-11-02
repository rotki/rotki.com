import { formatDate as vueUseFormatDate } from '@vueuse/shared';

/** True when the value parses to a real date, so not a placeholder such as "Never". */
export function isValidDate(date: string | Date): boolean {
  const dateObject: Date = typeof date === 'string' ? new Date(date) : date;
  return !Number.isNaN(dateObject.getTime());
}

export function formatDate(date: string | Date | undefined, format = 'MMMM DD, YYYY') {
  if (!date)
    return '';

  if (!isValidDate(date)) {
    return typeof date === 'string' ? date : '';
  }

  const dateObject: Date = typeof date === 'string' ? new Date(date) : date;

  return vueUseFormatDate(dateObject, format);
}
