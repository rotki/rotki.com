import { formatDate as vueUseFormatDate } from '@vueuse/shared';

export function formatDate(date: string | Date | undefined, format = 'MMMM DD, YYYY') {
  if (!date)
    return '';

  const dateObject: Date = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObject.getTime())) {
    return typeof date === 'string' ? date : '';
  }

  return vueUseFormatDate(dateObject, format);
}
