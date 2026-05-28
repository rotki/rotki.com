export function integrationSlug(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\da-z]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
