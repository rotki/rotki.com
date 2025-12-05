import type { Country } from '~/composables/use-countries';

/**
 * Get the full country name from a country code
 * @param countryCode The ISO country code (e.g., 'US', 'GB')
 * @param countries Array of country objects from useCountries()
 * @returns The full country name or the code if not found
 */
export function getCountryName(countryCode: string | null | undefined, countries: Country[]): string {
  if (!countryCode) {
    return '';
  }

  const country = countries.find(c => c.code === countryCode);
  return country?.name ?? countryCode;
}
