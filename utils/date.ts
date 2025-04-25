import { formatDate as vueUseFormatDate } from '@vueuse/shared';

export function formatDate(date: string | Date, format = 'MMMM DD, YYYY') {
  if (!date)
    return '';

  const dateObject: Date = typeof date === 'string' ? new Date(date) : date;

  return vueUseFormatDate(dateObject, format);
}
