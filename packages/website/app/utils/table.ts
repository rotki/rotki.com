/** The smallest page size the ui-library tables offer; their default limits are 10, 25, 50 and 100. */
const SMALLEST_PAGE_SIZE = 10;

/** True when every row fits on the smallest page, so a pagination bar could not change what shows. */
export function fitsOnePage(rows: readonly unknown[]): boolean {
  return rows.length <= SMALLEST_PAGE_SIZE;
}
