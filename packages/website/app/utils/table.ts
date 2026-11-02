import type { DataTableColumn } from '@rotki/ui-library';

/** The smallest page size the ui-library tables offer; their default limits are 10, 25, 50 and 100. */
const SMALLEST_PAGE_SIZE = 10;

/** True when every row fits on the smallest page, so a pagination bar could not change what shows. */
export function fitsOnePage(rows: readonly unknown[]): boolean {
  return rows.length <= SMALLEST_PAGE_SIZE;
}

/**
 * Keeps every cell, buttons included, on one line, so all rows of a table share one height and a
 * narrow screen scrolls the table instead of growing its rows. Data cells carry `colspan="1"`; the
 * empty and loading states span the whole row, so their text still wraps.
 */
export const SINGLE_LINE_ROWS = '[&_td[colspan="1"]]:whitespace-nowrap [&_td[colspan="1"]_button]:whitespace-nowrap';

/**
 * Puts the columns named in `order` first, in that order, and keeps the rest after them as they were.
 * Narrow screens use it to lead with what matters, since the rest of the row is off to the side.
 */
export function orderColumns<T extends object>(columns: DataTableColumn<T>[], order: readonly string[]): DataTableColumn<T>[] {
  const rank = (column: DataTableColumn<T>): number => {
    const index = order.indexOf(String(column.key));
    return index === -1 ? order.length : index;
  };
  return columns.toSorted((a, b) => rank(a) - rank(b));
}
