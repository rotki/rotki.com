import type { TablePaginationData } from '@rotki/ui-library';
import type { Ref } from 'vue';
import { fitsOnePage, SINGLE_LINE_ROWS } from '~/utils/table';

/** The `RuiDataTable` props every account table shares. */
interface AccountTableProps {
  class: string;
  hidePagination: boolean;
  outlined: true;
}

interface UseAccountTableReturn {
  /** The table's `v-model:pagination`. */
  modelPagination: Ref<TablePaginationData | undefined>;
  /** Bound with `v-bind`: one-line rows, an outline, and no pagination bar when it could not page. */
  tableProps: Readonly<Ref<AccountTableProps>>;
}

/** The look and paging the account tables share, so each table only adds its columns and cells. */
export function useAccountTable(rows: MaybeRefOrGetter<readonly unknown[]>): UseAccountTableReturn {
  const modelPagination = ref<TablePaginationData>();

  const tableProps = computed<AccountTableProps>(() => ({
    class: SINGLE_LINE_ROWS,
    hidePagination: fitsOnePage(toValue(rows)),
    outlined: true,
  }));

  return { modelPagination, tableProps };
}
