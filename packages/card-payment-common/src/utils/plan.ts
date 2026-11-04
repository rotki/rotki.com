/** A plan name as the checkout shows it: "basic" or "BASIC" becomes "Basic". */
export function formatPlanName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}
