'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '@/app/_shared/components/ui/input/input';
import { Pagination } from '@/app/_shared/components/ui/pagination/pagination';
import { Button } from '@/app/_shared/components/ui/button/button';
import { NoContentCard } from '@/app/_shared/components/ui/noContentCard/noContentCard';
import { Spinner } from '@/app/_shared/components/ui/spinner/spinner';
import styles from './dataTable.module.scss';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalItems?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isLoading?: boolean;
  onExportCsv?: () => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  actions?: React.ReactNode;
  footerRow?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  totalItems,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search across all columns...',
  isLoading = false,
  onExportCsv,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  actions,
  footerRow,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  emptyAction,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) onSort(key);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {onSearchChange && (
            <div className={styles.search}>
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                size="sm"
              />
            </div>
          )}
        </div>
        <div className={styles.toolbarRight}>
          {onExportCsv && (
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              Export CSV
            </Button>
          )}
          {actions}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner size="lg" />
        </div>
      ) : data.length === 0 ? (
        <NoContentCard
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={[
                      styles.th,
                      col.sortable ? styles['th--sortable'] : '',
                      sortColumn === col.key ? styles['th--active'] : '',
                    ].filter(Boolean).join(' ')}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span>{col.label}</span>
                    {col.sortable && sortColumn === col.key && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' \u2191' : ' \u2193'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={(row as Record<string, unknown>).id as string || index} className={styles.tr}>
                  {columns.map((col) => (
                    <td key={col.key} className={styles.td}>
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {footerRow && (
              <tfoot>
                {footerRow}
              </tfoot>
            )}
          </table>
        </div>
      )}

      {totalPages > 1 && onPageChange && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            {totalItems !== undefined && (
              <span className="text-sm text-(--color-text-secondary)">
                Showing {((currentPage - 1) * 10) + 1}–{Math.min(currentPage * 10, totalItems)} of {totalItems}
              </span>
            )}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
