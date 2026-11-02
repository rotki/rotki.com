import type { DataTableColumn } from '@rotki/ui-library';
import { describe, expect, it } from 'vitest';
import { fitsOnePage, orderColumns } from '~/utils/table';

interface Row {
  date: string;
  plan: string;
  amount: number;
  invoice: string;
}

const columns: DataTableColumn<Row>[] = [
  { key: 'date', label: 'Date' },
  { key: 'plan', label: 'Plan' },
  { key: 'amount', label: 'Amount' },
  { key: 'invoice', label: 'Invoice' },
];

const keys = (list: DataTableColumn<Row>[]): string[] => list.map(column => String(column.key));

describe('utils/table.ts - orderColumns', () => {
  it('puts the named columns first and keeps the others in their order', () => {
    expect(keys(orderColumns(columns, ['date', 'amount', 'invoice']))).toEqual(['date', 'amount', 'invoice', 'plan']);
  });

  it('ignores names that are not columns and leaves the input as it was', () => {
    expect(keys(orderColumns(columns, ['invoice', 'missing']))).toEqual(['invoice', 'date', 'plan', 'amount']);
    expect(keys(columns)).toEqual(['date', 'plan', 'amount', 'invoice']);
  });
});

describe('utils/table.ts - fitsOnePage', () => {
  it('is true up to the smallest page size', () => {
    expect(fitsOnePage(Array.from({ length: 10 }))).toBe(true);
    expect(fitsOnePage(Array.from({ length: 11 }))).toBe(false);
  });
});
