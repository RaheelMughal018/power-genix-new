'use client';

import React from 'react';
import { DateRangePicker } from '@/app/_shared/components/ui/dateRangePicker/dateRangePicker';
import { SearchableDropdown } from '@/app/_shared/components/ui/searchableDropdown/searchableDropdown';
import styles from './filterBar.module.scss';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  value?: string;
}

interface FilterBarProps {
  filters?: FilterConfig[];
  onFilterChange?: (key: string, value: string) => void;
  showDateRange?: boolean;
  onDateRangeChange?: (range: { from: string; to: string } | null) => void;
  fiscalYearStart?: number;
  className?: string;
}

export const FilterBar = ({
  filters = [],
  onFilterChange,
  showDateRange = false,
  onDateRangeChange,
  fiscalYearStart,
  className = '',
}: FilterBarProps) => {
  const hasFilters = filters.length > 0;
  const hasActiveFilter = filters.some((f) => f.value && f.value !== '');

  const handleClear = () => {
    filters.forEach((f) => onFilterChange?.(f.key, ''));
    onDateRangeChange?.(null);
  };

  return (
    <div className={[styles.filterBar, className].filter(Boolean).join(' ')}>
      {hasFilters && (
        <div className={styles.filterBar__selects}>
          {filters.map((filter) => (
            <div key={filter.key} className={styles.filterBar__selectGroup}>
              <SearchableDropdown
                label={filter.label}
                options={filter.options.map((opt) => ({ value: opt.value, label: opt.label }))}
                value={filter.value || ''}
                onChange={(v) => onFilterChange?.(filter.key, String(v ?? ''))}
                placeholder={`All ${filter.label}s`}
              />
            </div>
          ))}
        </div>
      )}

      {showDateRange && (
        <div className={styles.filterBar__dateRange}>
          <DateRangePicker
            onChange={onDateRangeChange ?? (() => {})}
            fiscalYearStart={fiscalYearStart}
          />
        </div>
      )}

      {(hasActiveFilter || showDateRange) && (
        <button type="button" className={styles.filterBar__clearBtn} onClick={handleClear}>
          Clear all
        </button>
      )}
    </div>
  );
};
